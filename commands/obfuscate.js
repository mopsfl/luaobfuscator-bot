const { createEmbed } = require("../utils/embed")
const { sendErrorMessage } = require("../utils/command")
const { Colors } = require("discord.js")
const { getEmoji } = require("../utils/misc")
const config = require("../.config")
const fetch = require("fetch")
const { obfuscate } = require("../utils/obfuscate")

module.exports = {
    enabled: true,

    category: "OBFUSCATION",
    command: "obfuscate",
    aliases: ["obf"],

    arguments: "<codeblock | file>",

    allow_dm: true,
    ignore_arguments: false, //wont throw any syntax error even if the arguments are wrong

    callback: async function(arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return
        if (message.content.includes("```")) {
            const script = arg.rawargs.replace(/(```lua|```)/g, "")
            const res = await obfuscate(script, message)
        } else if ([...message.attachments].length > 0) {
            const attachment = message.attachments.first()
            const url = attachment ? attachment.url : null

            if (!url) {
                let error_embed = createEmbed({
                    title: `${getEmoji("error")} Error`,
                    description: "```Unable to get url from attachment.```",
                    color: Colors.Red,
                    timestamp: true
                })
                return message.reply({ embeds: [error_embed] })
            }

            fetch.fetchUrl(url, async(error, meta, body) => {
                if (error) {
                    sendErrorMessage(error, message)
                    console.error(error)
                    return
                }
                const script = body.toString()
                obfuscate(script, message)
            })
        } else {
            let usage_args = arg.props.arguments.length > 0 ? "`" + `${arg.props.arguments}` + "`" : ""
            let usage_cmd = "`" + `${config.prefix}${arg.cmd}` + "`"
            let error_embed = createEmbed({
                title: `${getEmoji("error")} Syntax Error`,
                description: "```Please provide a valid Lua script as a codeblock or a file.```",
                color: Colors.Red,
                timestamp: true,
                fields: [
                    { name: "Syntax:", value: `${usage_cmd} ${usage_args}` },
                    { name: "Reminder:", value: `If you need help, go to <#1083105006506487919> or ask in <#1069422456579829822>` }
                ]
            })
            return message.reply({ embeds: [error_embed] })
        }
    }
}