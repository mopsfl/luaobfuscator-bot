import { PermissionFlagsBits, Colors, Message, Collection, User, ClientUser, GuildMember } from "discord.js"
import * as self from "../index"
import { UUID, randomUUID } from "crypto"
import { RawUserData } from "discord.js/typings/rawDataTypes"

export default class Command {
    constructor(
        readonly prefix = self.config.prefix,
        public commands?: Map<string, command>
    ) { }

    getCommand(message: Message) { return this.getArgs(message)?.shift()?.toLowerCase() }
    getArgs(message: Message) { return message.content.replace(/`+[^`]*`+/gm, "")?.trim()?.slice(this.prefix.length)?.split(' ') }
    getRawArgs(message: Message) { return message.content.slice(this.prefix.length).slice(this.getCommand(message).length + 1) }
    isBotMention(message: Message) { return message.mentions.users.find(id => id == global.client.user.id) }
    hasPermission(user: GuildMember, permission_bit: bigint) { return user.permissions.has(permission_bit) || user.permissions.has(PermissionFlagsBits.Administrator) }
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

    async handleCommand(cmd: cmdStructure) {
        if (typeof (cmd.callback) != "function") return new Error("callback is not a <Function>")
        if (!(cmd.message instanceof Message)) return new Error("message is not a <Message>")
        if (!cmd.allowed) return cmd.message.reply("Missing permissions")
        try {
            const success = await cmd.callback(cmd)
            console.log(`> command '${cmd.name}', requested by '${cmd.message.author.username}', finished in ${new Date().getTime() - cmd.timestamp}ms (id: ${cmd.id})`);
            cmd.success = success
            let command_log: Array<cmdStructure> = await self.cache.get("command_log")
            if (!command_log) { await self.cache.set("command_log", []); command_log = [] }
            command_log.push(cmd)
            await self.cache.set(JSON.stringify(command_log), cmd)
        } catch (error) {
            self.Debug(error, true)
        }
    }
}

export interface command {
    name: string | Array<string>,
    callback: Function,
    permissions: Array<bigint>,
    required_roles: Array<string>
}

export interface cmdStructure {
    prefix: string,
    name: string | Array<string>,
    arguments: Array<string | number>,
    id: string,
    callback: Function,
    message: Message,
    timestamp: number,
    allowed: boolean,
    success: boolean,
}