import { PermissionsBitField, Colors, Message } from "discord.js"
import * as self from "../index"
import { UUID, randomUUID } from "crypto"

export default class Command {
    constructor(
        readonly prefix = self.config.prefix
    ) { }

    getCommand(message: Message) {
        return this.getArgs(message).shift().toLowerCase()
    }

    getArgs(message: Message) {
        if (!message || !message.content) return
        return message.content.replace(/`+[^`]*`+/gm, "").trim().slice(this.prefix.length).split(' ')
    }
    getRawArgs(message: Message) {
        if (!message) return
        return message.content.slice(this.prefix.length).slice(this.getCommand(message).length + 1)
    }
    isCommand(message: Message) {
        if (!message) return
        const command = this.getCommand(message).replace(/```[^`]*```/gm, "").trim()
        if (global.client.commands.find(c => c.command == command || c.aliases?.includes(command))) {
            return message.content.startsWith(this.prefix) && this.getCommand(message) != ""
        }
    }
    getProps(message: Message) {
        if (!message) return
        return global.client.commands.find(c => c.command == this.getCommand(message) || c.aliases?.includes(this.getCommand(message)))
    }
    isBotMention(message: Message) {
        if (!message) return
        return message.mentions.users.find(id => id == global.client.user.id)
    }
    parseMentions(message: Message) {
        if (!message) return
        const mentions = message.mentions.users
        if (!mentions) return
        let users = []

        mentions.forEach(async (id: any) => {
            await global.client.users.fetch(id).then(user => {
                users[id] = user
            }).catch(console.error)
        })
        return users
    }
    hasPermission(user, permission_bit) {
        if (!user || !permission_bit) return
        return user.permissions.has(permission_bit) || user.permissions.has(PermissionsBitField.Flags.Administrator)
    }
    createCommandId() {
        return randomUUID()
    }
    sendErrorMessage(error: Error, message: Message, type: string) {
        if (!message || !error) return
        let error_message = "```" + `${error.message || error[0]}` + "```"
        let error_name = "```" + `${error.name || error[2]}` + "```"
        /*let error_embed = createEmbed({
            title: `${getEmoji("error")} ${error.message ? "Internal Error" : error[1]} - ${error_name}`,
            color: Colors.Red,
            fields: [
                { name: "Error:", value: `${error_message}` }
            ],
            timestamp: true,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: self.config.icon_url
            }
        })
        if (!type) return message.reply({ embeds: [error_embed] })
        if (type == "edit") return message.edit({ embeds: [error_embed] })*/
    }
}