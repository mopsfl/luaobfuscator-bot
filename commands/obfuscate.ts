import { Colors, EmbedBuilder, EmbedData, EmbedField, bold, codeBlock, hyperlink, inlineCode } from "discord.js";
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import * as self from "../index"
import { ObfuscationProcess, ObfuscationResult } from "../modules/Utils";

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

        let script_content = "",
            chunksAmount = 0,
            hasWebhook = false,
            hasCodeBlock = self.utils.hasCodeblock(cmd.raw_arguments)

        // Get Script Content
        if (hasCodeBlock) {
            hasWebhook = self.utils.hasWebhook(cmd.raw_arguments)
            script_content = self.utils.parseCodeblock(cmd.raw_arguments)
        } else if ([...cmd.message.attachments].length > 0) {
            const attachment = cmd.message.attachments.first()
            const url = attachment?.url
            if (!url) self.utils.SendErrorMessage("error", cmd, "Unable to get url from attachment.")
            await fetch(url).then(async res => {
                const chunks = await self.utils.readAllChunks(res.body)
                chunksAmount = chunks.length
                chunks.forEach(chunk => {
                    script_content += Buffer.from(chunk).toString() || ""
                })
            })
        } else return self.utils.SendErrorMessage("syntax", cmd, "Please provide a valid Lua script as a codeblock or a file.", null, [
            { name: "Syntax:", value: inlineCode(`${self.config.prefix}${cmd.used_command_name} <codeblock> | <file>`), inline: false },
            { name: "Reminder:", value: `If you need help, you may ask in <#1128990603087200276> for assistance.`, inline: false }
        ])

        // Obfuscation Process
        const obfuscation_process: ObfuscationProcess = {
            processes: [],
            embed: null,
            error: null,
            results: null
        }

        obfuscation_process.processes.push(`${GetEmoji("yes")} Buffer completed! (${inlineCode(chunksAmount.toString())} chunks)`)
        obfuscation_process.embed = self.Embed({
            color: Colors.Yellow,
            timestamp: true,
            fields: [
                { name: `Obfuscation Process:`, value: obfuscation_process.processes[0], inline: false }
            ],
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: self.config.icon_url
            }
        })

        // Parse Webhooks
        if (hasWebhook) {
            const webhooks = self.utils.parseWebhooks(script_content)
            let webhook_string = ""
            for (let i = 0; i < webhooks.length; i++) {
                const webhook = webhooks[i].trim();
                if (!webhook_string.includes(webhook)) {
                    webhook_string += codeBlock("lua", webhook)
                }
            }
        }


        await cmd.message.reply({ embeds: [obfuscation_process.embed] }).then(async msg => {
            async function updateProcess() {
                let process_string = ""
                obfuscation_process.processes.forEach(p => process_string += `${p}\n`)
                obfuscation_process.embed.data.fields[0].value = process_string
                return await msg.edit({ embeds: [obfuscation_process.embed] })
            }

            async function createProcess(process_text: string, process_text_finished: string, callback: Function) {
                let process_id = obfuscation_process.processes.push(process_text); process_id -= 1
                await updateProcess(); const callback_result: ObfuscationResult | Error = await callback(process_id)
                if (callback_result instanceof Error || callback_result?.message) return callback_result
                obfuscation_process.processes[process_id] = process_text_finished

            }
            await createProcess(`${GetEmoji("loading")} Obfuscating script...`, `${GetEmoji("yes")} Script obfuscated!`, async (process_id: number) => {
                obfuscation_process.results = await self.utils.obfuscateScript(script_content, cmd.message)
                if (!obfuscation_process.results.code) {
                    obfuscation_process.embed.setColor("Red")
                    obfuscation_process.processes[process_id] = `${GetEmoji("no")} Obfuscation failed!`
                    return await updateProcess()
                }
                obfuscation_process.processes[process_id] = `${GetEmoji("yes")} Script obfuscated!`
                await updateProcess()
                return obfuscation_process.results
            })


        })

        return true
    }
}

module.exports = Command