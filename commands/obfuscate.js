const { createEmbed } = require("../utils/embed")
const { sendErrorMessage } = require("../utils/command")
const { Colors, codeBlock, blockQuote, inlineCode, hyperlink, Attachment, Collection } = require("discord.js")
const { getEmoji } = require("../utils/misc")
const config = require("../.config")
const { parseCodeblock, hasCodeblock, hasWebhook, createSession, parseWebhooks, manualObfuscateScript, obfuscateScript, createFileAttachment } = require("../utils/obfuscate-util")

const ratelimits = new Collection()

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

            await fetch(url).then(async res => {
                const reader = res.body.getReader()
                await reader.read().then(({ done, value }) => {
                    script = Buffer.from(value).toString()
                    if (typeof script == "string") haswebhook = hasWebhook(script)
                })
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
                    { name: "Reminder:", value: `If you need help, ${message.guild.id == 1069422455933902949 ? `go to <#1083105006506487919> or ask in <#1069422456579829822>.` : `${client.guilds.fetch(1069422455933902949).then(guild => guild.members.filter(m => m == message.author.id )) ? `go to <#1083105006506487919> or ask in <#1069422456579829822>.` : `join our ${hyperlink("Discord", "https://discord.gg/fygAGDMm5q")} and go to <#1083105006506487919> or ask in <#1069422456579829822> once you join.`}} }
                ], footer: {
                    text: "LuaObfuscator Bot • made by mopsfl#4588",
                    iconURL: config.ICON_URL
                }
            })
            return message.reply({ embeds: [error_embed] })
        }

        if (ratelimits.has(message.author.id)) {
            return sendErrorMessage(["You are already obfuscating a script. Please wait!", "Error", "Rate Limit"], message)
        }

        let process_embed = createEmbed({
            fields: [
                { name: `Obfuscation Process`, value: `${getEmoji("loading")} Obfuscating script...` }
            ],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: config.ICON_URL
            }
        })

        if (haswebhook) {
            const webhooks = parseWebhooks(script)
            if (!webhooks) return
            let embed_webhook_string = ""
            for (let i = 0; i < webhooks?.length; i++) {
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
                                        value: `${codeBlock("diff", "- Please remove ${webhooks.length > 1 ? "all of the Discord webhooks" : "the Discord webhook"} from your script.")}`
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
                                title: `${getEmoji("warn")} ${webhooks.length > 1 ? "Webhooks" : "Webhook"} detected`,
                                fields: [
                                    {
                                        name: "Note:",
                                        value: `We've detected that your script has ${webhooks.length > 1 ? "Discord webhooks" : "a Discord webhook"} implemented.\nUsing them for malicious purposes (e.g. scams, IP loggers, etc.) can result in consequences.`
                                    },
                                    {
                                        name: `Webhooks found: (${webhooks.length})`,
                                        value: embed_webhook_string
                                    },
                                ],
                                color: Colors.Yellow,
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
        ratelimits.set(message.author.id, true)
        const obfuscate_script = await obfuscateScript(script, message)
        if (obfuscate_script.message && !obfuscate_script.code || !obfuscate_script.sessionId) {
            process_embed.data.fields[0].value = `${getEmoji("error")} Obfuscation failed!${obfuscate_script.message ? `\n**Error Details:**\n${getEmoji("space")} ${obfuscate_script.message}` : ""}`
            process_embed.data.color = Colors.Red
            await response.edit({
                embeds: [process_embed]
            })
            return ratelimits.delete(message.author.id)
        }
        process_embed.data.fields[0].value = `${getEmoji("check")} Script obfuscated! ${hyperlink("[open]", config.SESSION_URL + obfuscate_script.sessionId)}\n${getEmoji("loading")} Creating attachment file...`
        await response.edit({
            embeds: [process_embed]
        })
        console.log(`Script by ${message.author.username} successfully obfuscated: ${obfuscate_script.sessionId}`)

        const file_attachment = createFileAttachment(Buffer.from(obfuscate_script.code))
        if (typeof file_attachment != "object") {
            process_embed.data.fields[0].value = `\n${getEmoji("check")} Script obfuscated! ${hyperlink("[open]", config.SESSION_URL + obfuscate_script.sessionId)}\n${getEmoji("error")} Failed to create attachment file!${file_attachment.name ? `\n${getEmoji("space")} ${file_attachment.name}${file_attachment.error ? `\n${getEmoji("space")} ${file_attachment.error}` : ""} : `${file_attachment.error ? `\n${getEmoji("space")} ${file_attachment.error}` : ""}`}`
            await response.edit({
                 embeds: [process_embed]
            })
            return ratelimits.delete(message.author.id)
        }

        process_embed.data.fields[0].value = `\n${getEmoji("check")} Script obfuscated! ${hyperlink("[open]", config.SESSION_URL + obfuscate_script.sessionId)}\n${getEmoji("check")} Attachment file created!`
        process_embed.data.color = Colors.Green
        await response.edit({
            embeds: [process_embed],
            files: [file_attachment]
        })
        return ratelimits.delete(message.author.id)
    }
}

global.ratelimits = ratelimits
