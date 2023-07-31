import { Colors, bold, codeBlock, hyperlink, inlineCode } from "discord.js";
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import * as self from "../index"

class Command {
    name = ["obfuscate", "obf", "obfsc"]
    category = self.commandCategories.LuaObfuscator
    description = ""

    callback = async (cmd: cmdStructure) => {
        if (!cmd.message.channel.isDMBased()) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            await cmd.message.reply(`no, use website: ${bold(self.config.STATUS_DISPLAY.endpoints.homepage)} ${GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
            return true
        }
        let script = "",
            _chunks = "0",
            haswebhook: boolean,
            hasCodeBlock = self.utils.hasCodeblock(cmd.raw_arguments)

        if (cmd.message.content.includes("```") && hasCodeBlock) {
            haswebhook = self.utils.hasWebhook(cmd.raw_arguments)
            script = self.utils.parseCodeblock(cmd.raw_arguments)
        } else if ([...cmd.message.attachments].length > 0) {
            const attachment = cmd.message.attachments.first()
            const url = attachment ? attachment.url : null
            if (!url) {
                let error_embed = self.Embed({
                    title: `${GetEmoji("no")} Error`,
                    description: `${codeBlock("Unable to get url from attachment.")}`,
                    color: Colors.Red,
                    timestamp: true
                })
                return cmd.message.reply({ embeds: [error_embed] })
            }
            await fetch(url).then(async res => {
                const chunks = await self.utils.readAllChunks(res.body)
                _chunks = chunks.length.toString()

                chunks.forEach(chunk => {
                    script = script + Buffer.from(chunk).toString() || ""
                })
            })
        } else {
            return cmd.message.reply("Please provide a valid Lua script as a codeblock or a file.")
        }

        let process_embed = self.Embed({
            fields: [
                { name: `Obfuscation Process`, value: `${GetEmoji("yes")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${GetEmoji("loading")} Obfuscating script...`, inline: false }
            ],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: self.config.icon_url
            }
        })

        if (haswebhook) {
            const webhooks = self.utils.parseWebhooks(script)
            if (!webhooks) return
            let embed_webhook_string = ""
            for (let i = 0; i < webhooks?.length; i++) {
                if (!embed_webhook_string.includes(webhooks[i].trim())) {
                    embed_webhook_string = embed_webhook_string + codeBlock("lua", webhooks[i].trim())
                }
            }
        }

        let response = await cmd.message.reply({ embeds: [process_embed] })
        const obfuscate_script = await self.utils.obfuscateScript(script, cmd.message)
        if (obfuscate_script.message && !obfuscate_script.code || !obfuscate_script.sessionId) {
            process_embed.data.fields[0].value = `${GetEmoji("no")} Failed obfuscating!`
            process_embed.data.color = Colors.Red
            await response.edit({
                embeds: [process_embed]
            })
            return
        }
        process_embed.data.fields[0].value = `${GetEmoji("yes")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${GetEmoji("yes")} Script obfuscated! ${hyperlink("[open]", self.config.session_url + obfuscate_script.sessionId)}\n${GetEmoji("loading")} Creating attachment file...`
        await response.edit({
            embeds: [process_embed]
        })
        console.log(`Script by ${cmd.message.author.username} successfully obfuscated: ${obfuscate_script.sessionId}`)

        const file_attachment = self.utils.createFileAttachment(Buffer.from(obfuscate_script.code))
        if (typeof file_attachment != "object") {
            process_embed.data.fields[0].value = `${GetEmoji("yes")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${GetEmoji("yes")} Script obfuscated! ${hyperlink("[open]", self.config.session_url + obfuscate_script.sessionId)}\n${GetEmoji("no")} Failed creating attachment file!`
            process_embed.data.color = Colors.Red
            return
        }

        process_embed.data.fields[0].value = `${GetEmoji("yes")} Buffer completed! (${inlineCode(_chunks)} chunks)\n${GetEmoji("yes")} Script obfuscated! ${hyperlink("[open]", self.config.session_url + obfuscate_script.sessionId)}\n${GetEmoji("yes")} Attachment file created!`
        process_embed.data.color = Colors.Green
        await response.edit({
            embeds: [process_embed]
        })
        await cmd.message.reply({
            files: [file_attachment],
        })

        return true
    }
}

module.exports = Command