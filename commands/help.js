const { createEmbed } = require("../utils/embed.js")
const { Colors } = require("discord.js")
const commandList = require("../utils/commandList")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "help",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function(arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        let embed = createEmbed({
            title: "Help",
            color: Colors.Green,
            fields: commandList.create(),
            timestamp: true
        })
        return await message.reply({ embeds: [embed] })
    }
}