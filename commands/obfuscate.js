const { createEmbed } = require("../utils/embed")
const { sendErrorMessage } = require("../utils/command")
const { Colors, codeBlock, blockQuote, inlineCode, hyperlink, Attachment } = require("discord.js")
const { getEmoji } = require("../utils/misc")
const config = require("../.config")
const fetch = require("fetch")
const { parseCodeblock, hasCodeblock, hasWebhook, createSession, parseWebhooks, manualObfuscateScript, obfuscateScript, createFileAttachment } = require("../utils/obfuscate-util")

module.exports = {
    enabled: true,

    category: "OBFUSCATION",
    command: "obfuscate",
    aliases: ["obf"],

    arguments: "<codeblock | file>",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return
        let script = null, haswebhook
        const iscodeblock = hasCodeblock(arg.rawargs)
        if (message.content.includes("```") && iscodeblock) {
            haswebhook = hasWebhook(arg.rawargs)
            script = parseCodeblock(arg.rawargs)
        } else if ([...message.attachments].length > 0) {
            const attachment = message.attachments.first()
            const url = attachment ? attachment.url : null
            if (!url) {
                let error_embed = createEmbed({
                    title: `${getEmoji("error")} Error`,
                    description: `${codeBlock("Unable to get url from attachment.")}`,
                    color: Colors.Red,
                    timestamp: true
                })
                return message.reply({ embeds: [error_embed] })
            }

            fetch.fetchUrl(url, async (error, meta, body) => {
                if (error) {
                    sendErrorMessage(error, message)
                    console.error(error)
                    return
                }
                script = body.toString()
                if (typeof script == "string") haswebhook = hasWebhook(script)
            })
        } else {
            let usage_args = arg.props.arguments.length > 0 ? "`" + `${arg.props.arguments}` + "`" : ""
            let usage_cmd = "`" + `${config.prefix}${arg.cmd}` + "`"
            let error_embed = createEmbed({
                title: `${getEmoji("error")} Syntax Error`,
                description: `${codeBlock("Please provide a valid Lua script as a codeblock or a file.")}`,
                color: Colors.Red,
                timestamp: true,
                fields: [
                    { name: "Syntax:", value: `${usage_cmd} ${usage_args}` },
                    { name: "Reminder:", value: `If you need help, go to <#1083105006506487919> or ask in <#1069422456579829822>` }
                ], footer: {
                    text: "LuaObfuscator Bot • made by mopsfl#4588",
                    iconURL: config.ICON_URL
                }
            })
            return message.reply({ embeds: [error_embed] })
        }

        let process_embed = createEmbed({
            fields: [
                { name: `Obfuscation Process`, value: `${getEmoji("loading")} Creating session...` }
            ],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: config.ICON_URL
            }
        })

        if (haswebhook) {
            const webhooks = parseWebhooks(arg.rawargs)
            let embed_webhook_string = ""
            for (let i = 0; i < webhooks.length; i++) {
                if (!embed_webhook_string.includes(webhooks[i].trim())) {
                    embed_webhook_string = embed_webhook_string + codeBlock("lua", webhooks[i].trim())
                }
            }
            switch (config.script_scan_options.discord_webhooks) {
                case "block": {
                    return message.author.send({
                        embeds: [createEmbed(
                            {
                                title: `${getEmoji("failed")} Obfuscation cancelled`,
                                fields: [
                                    {
                                        name: "Problems:",
                                        value: `${codeBlock("diff", "- Please remove all discord webhooks from your script.")}`
                                    },
                                    {
                                        name: `Webhooks found: (${webhooks.length})`,
                                        value: embed_webhook_string
                                    },
                                ],
                                color: Colors.Red,
                                timestamp: true,
                                footer: {
                                    text: "LuaObfuscator Bot • made by mopsfl#4588",
                                    iconURL: config.ICON_URL
                                }
                            }
                        )]
                    })
                    break
                }
                case "warn": {
                    message.author.send({
                        embeds: [createEmbed(
                            {
                                title: `${getEmoji("warn")} Webhook detected`,
                                fields: [
                                    {
                                        name: "Note:",
                                        value: `${"We've detected that your script has discord webhooks implemented.\nUsing them for malicious purposes (e.g. Scams, IP Loggers, ...) can result in a punishment."}`
                                    },
                                    {
                                        name: `Webhooks found: (${webhooks.length})`,
                                        value: embed_webhook_string
                                    },
                                ],
                                color: Colors.Red,
                                timestamp: true,
                                footer: {
                                    text: "LuaObfuscator Bot • made by mopsfl#4588",
                                    iconURL: config.ICON_URL
                                }
                            }
                        )]
                    })
                }
            }
        }

        let response = await message.reply({ embeds: [process_embed] })

        const session = await createSession(script)
        if (!session.sessionId) return sendErrorMessage([session.error || "Unable to create session", "Error", session.error_name || "Unknown Error"], message)

        console.log(`New session created by ${message.author.tag}: ${session.sessionId}`)
        process_embed.data.fields[0].value = `${getEmoji("check")} Session created! ${hyperlink("[open]", config.SESSION_URL + session.sessionId)}\n${getEmoji("loading")} Obfuscating script...`
        await response.edit({
            embeds: [process_embed]
        })

        const obfuscate_script = await obfuscateScript(script)
        if (obfuscate_script.message && !obfuscate_script.code) return sendErrorMessage([obfuscate_script.message, "Error", "obfuscation"], message)
        process_embed.data.fields[0].value = `${getEmoji("check")} Session created! ${hyperlink("[open]", config.SESSION_URL + session.sessionId)}\n${getEmoji("check")} Script obfuscated! ${hyperlink("[open]", config.SESSION_URL + obfuscate_script.sessionId)}\n${getEmoji("loading")} Creating attachment file...`
        await response.edit({
            embeds: [process_embed]
        })
        console.log(`Script by ${message.author.tag} successfully obfuscated: ${obfuscate_script.sessionId}`)

        const file_attachment = createFileAttachment(Buffer.from(obfuscate_script.code))
        if (typeof file_attachment != "object") return sendErrorMessage([file_attachment.error || "Unable to create file attachment.", "Error", file_attachment.error_name], message)

        process_embed.data.fields[0].value = `${getEmoji("check")} Session created! ${hyperlink("[open]", config.SESSION_URL + session.sessionId)}\n${getEmoji("check")} Script obfuscated! ${hyperlink("[open]", config.SESSION_URL + obfuscate_script.sessionId)}\n${getEmoji("check")} Attachment file created!`
        await response.edit({
            embeds: [process_embed]
        })
        await message.reply({
            files: [file_attachment],
        })
    }
}