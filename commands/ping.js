const { createEmbed } = require("../utils/embed.js")
const { Colors } = require("discord.js")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "ping",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function(arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        let embed = createEmbed({
            description: "Pinging... Please wait!",
            color: Colors.Yellow,
        })
        await message.reply({ embeds: [embed] }).then(async(msg) => {
            const ping = msg.createdTimestamp - message.createdTimestamp
            return await msg.edit({
                embeds: [createEmbed({ description: "Received a ping of: `" + `${ping+"ms"}` + "`", color: Colors.Green })]
            })
        })
    }
}