import { PermissionFlagsBits, Message, GuildMember } from "discord.js"
import * as self from "../index"
import { randomUUID } from "crypto"
import NoHello from "./NoHello"
import { BotStats } from "../commands/botstats"
import Database from "./Database"

export default class Command {
    constructor(
        readonly prefix = self.config.prefix,
        public commands?: Map<string, command>,
        public ratelimits: Map<string, boolean> = new Map()
    ) { }

    getCommand(message: Message) { return this.getArgs(message)?.shift()?.toLowerCase() }
    getArgs(message: Message) { return message.content.replace(/`+[^`]*`+/gm, "")?.trim()?.slice(this.prefix.length)?.split(' ') }
    getRawArgs(message: Message) { return message.content.slice(this.prefix.length).slice(this.getCommand(message).length + 1) }
    isBotMention(message: Message) { return message.mentions.users.find(id => id == global.client.user.id) }
    hasPermission(user: GuildMember, permission_bit: bigint) { return user?.permissions?.has(permission_bit) || user?.permissions?.has(PermissionFlagsBits.Administrator) }
    createCommandId() { return randomUUID() }
    parseMentions(message: Message) {
        const mentions = message.mentions.users
        if (!mentions) return
        let users = []

        mentions.forEach(async (id: any) => {
            await self.client.users.fetch(id).then(user => {
                users[id] = user
            }).catch(console.error)
        })
        return users
    }

    getAllCommands() {
        return self.command.commands
    }

    async handleCommand(cmd: cmdStructure) {
        if (typeof (cmd.callback) != "function") return new Error("callback is not a <Function>")
        if (!(cmd.message instanceof Message)) return new Error("message is not a <Message>")
        if (!cmd.allowed) return self.utils.SendErrorMessage("permission", cmd, "Missing required permissions.")
        if (cmd.public_command === false && !self.config.allowed_guild_ids.includes(cmd.message.guildId)) return self.utils.SendErrorMessage("permission", cmd, "This command is disabled for this guild.")
        if (this.ratelimits.get(cmd.message.author.id) === true) return await self.utils.SendErrorMessage("ratelimit", cmd, null, null, null, 5000);

        try {
            this.ratelimits.set(cmd.message.author.id, true);

            const success = await cmd.callback(cmd)
            cmd.success = success

            Database.RowExists("cmd_stats", { command_name: cmd.name[0] }).then(([existsInCmdStats]) => {
                if (!existsInCmdStats) {
                    console.log(`${cmd.name[0]} cmd not registered in database yet. inserting...`);
                    Database.Insert("cmd_stats", { command_name: cmd.name[0], call_count: 1 }).catch(console.error)
                } else {
                    Database.Increment("cmd_stats", "call_count", { command_name: cmd.name[0] }).catch(console.error)
                }
            })

            Database.Increment("bot_statistics", "total_commands_executed").catch(console.error)

            this.ratelimits.set(cmd.message.author.id, false);
            console.log(`> command '${cmd.used_command_name}', requested by '${cmd.message.author.username}', finished in ${new Date().getTime() - cmd.timestamp}ms (id: ${cmd.id})`);
        } catch (error) {
            this.ratelimits.set(cmd.message.author.id, false);
            self.utils.SendErrorMessage("error", cmd, error)
            self.Debug(error, true)
        }
    }
}

export interface command {
    name: string | Array<string>,
    callback: Function,
    permissions?: Array<bigint>,
    required_roles?: Array<string>,
    category: "Bot" | "Misc" | "Lua Obfuscator",
    direct_message: boolean,
    description: string,
    syntax_usage: string,
    public_command: boolean,
    slash_command: boolean
}

export interface cmdStructure {
    prefix: string,
    name: string | Array<string>,
    used_command_name: string,
    arguments: Array<string | number>,
    raw_arguments: string,
    id: string,
    callback: Function,
    message: Message,
    timestamp: number,
    allowed: boolean,
    success: boolean,
    public_command: boolean,
    slash_command?: boolean,
}