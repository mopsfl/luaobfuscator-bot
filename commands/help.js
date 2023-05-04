const { createEmbed } = require("../utils/embed.js")
const { Colors } = require("discord.js")
const commandList = require("../utils/commandList")
const { getEmoji } = require("../utils/misc")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "help",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        const list = commandList.create()
        list[0].inline = true
        list[1].inline = true

        let embed = createEmbed({
            title: `${getEmoji("info")} Command List`,
            color: Colors.Green,
            fields: list,
            timestamp: true
        })
        return await message.reply({ embeds: [embed] })
    }
}