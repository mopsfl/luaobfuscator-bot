const { createEmbed } = require("../utils/embed.js")
const { Colors, bold } = require("discord.js")
const { getEmoji } = require("../utils/misc")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "obfuscate",
    aliases: ["obf"],

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg
        if (!message) return

        const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
        return message.reply(`no, use website: ${bold("https://luaobfuscator.com")} ${getEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
    }
}