const { createEmbed } = require("../utils/embed")
const { sendErrorMessage } = require("../utils/command")
const { Colors, codeBlock, blockQuote, inlineCode, hyperlink, Attachment, Collection } = require("discord.js")
const { getEmoji, readAllChunks } = require("../utils/misc")
const config = require("../.config")
const { parseCodeblock, hasCodeblock, hasWebhook, createSession, parseWebhooks, manualObfuscateScript, obfuscateScript, createFileAttachment } = require("../utils/obfuscate-util")

const ratelimits = new Collection()

module.exports = {
    enabled: false,

    category: "LUA OBFUSCATOR",
    command: "encryptstrings",
    aliases: ["estr", "ecstr", "encstr", "es"],

    arguments: "<codeblock | file>",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        let script = "", _chunks = 0
        const iscodeblock = hasCodeblock(arg.rawargs)
        if (message.content.includes("```") && iscodeblock) {
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
                const chunks = await readAllChunks(res.body)
                _chunks = chunks.length

                chunks.forEach(chunk => {
                    script = script + Buffer.from(chunk).toString() || ""
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
                    { name: "Reminder:", value: `If you need help, go to <#1083105006506487919> or ask in <#1069422456579829822>` }
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
                { name: `Obfuscation Process`, value: `${getEmoji("check")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${getEmoji("loading")} Creating session...` }
            ],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: config.ICON_URL
            }
        })

        let response = await message.reply({ embeds: [process_embed] })
        const session = await createSession(script)

        ratelimits.set(message.author.id, true)
        if (session.message && !session.sessionId) {
            process_embed.data.fields[0].value = `${getEmoji("error")} Failed obfuscating!`
            process_embed.data.color = Colors.Red
            await response.edit({
                embeds: [process_embed]
            })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([obfuscated_script.message || "Obfuscation failed!", "Error", "obfuscate"], message)
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${getEmoji("check")} Session created! ${hyperlink("[open]", config.SESSION_URL + session.sessionId)}\n${getEmoji("loading")} Obfuscating script...`
        await response.edit({
            embeds: [process_embed]
        })

        const obfuscated_script = await manualObfuscateScript(session.sessionId, {
            "MinifiyAll": true,
            "CustomPlugins": {
                "EncryptStrings": [100]
            }
        }, message)

        if (obfuscated_script.message && !obfuscated_script.code) {
            process_embed.data.fields[0].value = `${getEmoji("error")} Failed obfuscating!`
            process_embed.data.color = Colors.Red
            await response.edit({
                embeds: [process_embed]
            })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([obfuscated_script.message || "Obfuscation failed!", "Error", "minifying"], message)
        }

        console.log(`Script by ${message.author.tag} successfully obfuscated (vm): ${session.sessionId}`)
        process_embed.data.fields[0].value = `${getEmoji("check")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${getEmoji("check")} Session created! ${hyperlink("[open]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} Script obfuscated!\n${getEmoji("loading")} Creating attachment file...`
        await response.edit({
            embeds: [process_embed]
        })

        const file_attachment = createFileAttachment(Buffer.from(obfuscated_script.code))
        if (typeof file_attachment != "object") {
            process_embed.data.fields[0].value = `${getEmoji("check")} Session created! ${hyperlink("[open]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} Script obfuscated!\n${getEmoji("error")} Failed creating attachment file!`
            process_embed.data.color = Colors.Red
            ratelimits.delete(message.author.id)
            return sendErrorMessage([file_attachment.error || "Unable to create file attachment.", "Error", file_attachment.error_name], message)
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${getEmoji("check")} Session created! ${hyperlink("[open]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} Script obfuscated!\n${getEmoji("check")} Attachment file created!`
        process_embed.data.color = Colors.Green
        await response.edit({
            embeds: [process_embed]
        })
        await message.reply({
            files: [file_attachment],
        })
        ratelimits.delete(message.author.id)
    }
}

global.ratelimits = ratelimits