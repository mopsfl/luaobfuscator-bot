import { PermissionFlagsBits, Message, GuildMember } from "discord.js"
import * as self from "../index"
import { randomUUID } from "crypto"
import NoHello from "./NoHello"
import { BotStats } from "../commands/botstats"

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
        if (this.ratelimits.get(cmd.message.author.id) === true) return await self.utils.SendErrorMessage("ratelimit", cmd, null, null, null, 5000);
        try {
            const bot_stats: BotStats = await self.file_cache.get("bot_stats"),
                cmd_stats: BotStats = await self.file_cache.getSync("cmd_stats")
            if (bot_stats) {
                if (!bot_stats.total_commands_executed) bot_stats.total_commands_executed = 0
                bot_stats.total_commands_executed++;
                self.file_cache.set("bot_stats", bot_stats)
            }
            this.ratelimits.set(cmd.message.author.id, true);

            const success = await cmd.callback(cmd)
            cmd.success = success
            if (cmd_stats) {
                if (!cmd_stats[cmd.name[0]]) cmd_stats[cmd.name[0]] = 0
                cmd_stats[cmd.name[0]]++;
                self.file_cache.set("cmd_stats", cmd_stats)
            }
            //let command_log: Array<cmdStructure> = await self.cache.get("command_log")
            //if (!command_log) { await self.cache.set("command_log", []); command_log = [] }
            //command_log.push(cmd)
            //await self.cache.set(JSON.stringify(command_log), cmd)
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
    syntax_usage: string
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
}