const { prefix, ICON_URL } = require("../.config.js")
const { createEmbed } = require("../utils/embed")
const { getEmoji } = require("../utils/misc")

const { PermissionsBitField, User, Collection, Message, Colors } = require("discord.js")

module.exports = {
    /**
     * @description Gets the command that's being used in the message
     * @param { Message } message
     * @returns { String }
     */
    getCommand: function (message) {
        if (!message) return
        return this.getArgs(message).shift().toLowerCase()
    },
    /**
     * @description Gets the args that are being used in the message
     * @param { Message } message
     */
    getArgs: function (message) {
        if (!message || !message.content) return
        return message.content.replace(/`+[^`]*`+/gm, "").trim().slice(prefix.length).split(' ')
    },
    /**
     * @description Gets the raw args that are being used in the message as a string
     * @param { Message } message
     * @param { String } command
     */
    getRawArgs: function (message) {
        if (!message) return
        return message.content.slice(prefix.length).slice(this.getCommand(message).length + 1)
    },
    /**
     * @description Checks if the message is a command (starts with the bot prefix)
     * @param { Message } message
     */
    isCommand: function (message) {
        if (!message) return
        const command = this.getCommand(message).replace(/```[^`]*```/gm, "").trim()
        if (global.client.commands.find(c => c.command == command || c.aliases?.includes(command))) {
            return message.content.startsWith(prefix) && this.getCommand(message) != ""
        }
    },
    /**
     * @description Gets the properties of a command from the command collection
     * @param { Message } message
     */
    getProps: function (message) {
        if (!message) return
        return global.client.commands.find(c => c.command == this.getCommand(message) || c.aliases?.includes(this.getCommand(message)))
    },
    /**
     * @description Checks if the message mentioned the bot
     * @param { String } message
     */
    isBotMention: function (message) {
        if (!message) return
        return message.mentions.users.find(id => id == global.client.user.id)
    },
    /**
     * @description Parses all the mentions from a message
     * @param { Message } message
     */
    parseMentions: function (message) {
        if (!message) return
        const mentions = message.mentions.users
        if (!mentions) return
        let users = []

        mentions.forEach(async (id) => {
            await global.client.users.fetch(id).then(user => {
                users[id] = user
            }).catch(console.error)
        })
        return users
    },
    /**
     * @description Checks if the user has the specified permission(s)
     * @param { User } user 
     * @param { PermissionsBitField | [ PermissionsBitField ] } permission_bit 
     */
    hasPermission: function (user, permission_bit) {
        if (!user || !permission_bit) return
        return user.permissions.has(permission_bit) || user.permissions.has(PermissionsBitField.Flags.Administrator)
    },
    /**
     * @description Sents a error message
     * @param { Error | string } error
     * @param { Message } message
     */
    sendErrorMessage: function (error, message, type) {
        if (!message || !error) return
        let error_message = "```" + `${error.message || error[0]}` + "```"
        let error_name = "```" + `${error.name || error[2]}` + "```"
        let error_embed = createEmbed({
            title: `${getEmoji("error")} ${error.message ? "Internal Error" : error[1]} - ${error_name}`,
            color: Colors.Red,
            fields: [
                { name: "Error:", value: `${error_message}` },
            ],
            timestamp: true,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: ICON_URL
            }
        })
        if (!type) return message.reply({ embeds: [error_embed] })
        if (type == "edit") return message.edit({ embeds: [error_embed] })
    }
}