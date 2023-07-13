const { createEmbed } = require("../utils/embed.js")
const { Colors, inlineCode, PermissionsBitField } = require("discord.js")
const { fetchJSON } = require("../utils/misc.js")
const config = require("../.config")
const { createStatusEmbed, updateStatusMessage } = require("../utils/status.js")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "updatestatus",
    aliases: ["us", "updates", "upstat", "upstats"],

    required_permissions: [PermissionsBitField.Flags.Administrator],

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg
        if (!message) return
        const start_tick = new Date().getTime()

        try {
            message.reply({
                embeds: [createEmbed({
                    description: "Updating status display... Please wait!",
                    color: Colors.Yellow,
                })]
            }).then(async (msg) => {
                await updateStatusMessage()
                console.log("forces status display update")
                await msg.edit({
                    embeds: [createEmbed({
                        description: `Status display updated!\nTook ${inlineCode(`${Math.round(new Date().getTime() - start_tick)}ms`)}`,
                        color: Colors.Green,
                    })]
                })
            })
        } catch (err) { console.error(err) }
    }
}