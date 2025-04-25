import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Colors, bold, codeBlock, inlineCode } from "discord.js";
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import * as self from "../index"
import { ObfuscationProcess, ObfuscationResult } from "../modules/Utils";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database";

class Command {
    name = ["obfuscate", "obf", "obfsc"]
    category = CommandCategories.LuaObfuscator
    description = "Obfuscates your given input using the REST API with the default preset."
    syntax_usage = "<file | codeblock>"

    callback = async (cmd: cmdStructure) => {
        if (!cmd.message.channel.isDMBased()) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            await cmd.message.reply(`no, use website: ${bold(self.config.STATUS_DISPLAY.endpoints.homepage)} or slide in my dms ${GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
            return true
        }

        let script_content = "",
            chunksAmount = 0,
            hasWebhook = false,
            hasCodeBlock = self.utils.HasCodeblock(cmd.raw_arguments),
            file_attachment: AttachmentBuilder,
            start_time = new Date().getTime()

        // Get Script Content
        if (hasCodeBlock) {
            hasWebhook = self.utils.HasWebhook(cmd.raw_arguments)
            script_content = self.utils.ParseCodeblock(cmd.raw_arguments)
        } else if ([...cmd.message.attachments].length > 0) {
            const attachment = cmd.message.attachments.first()
            const url = attachment?.url
            if (!url) self.utils.SendErrorMessage("error", cmd, "Unable to get url from attachment.")
            await fetch(url).then(async res => {
                const chunks = await self.utils.ReadAllChunks(res.body)
                chunksAmount = chunks.length
                chunks.forEach(chunk => {
                    script_content += Buffer.from(chunk).toString() || ""
                })
            })
        } else return self.utils.SendErrorMessage("syntax", cmd, "Please provide a valid Lua script as a codeblock or a file.", null, [
            { name: "Syntax:", value: inlineCode(`${self.config.prefix}${cmd.used_command_name} <codeblock> | <file>`), inline: false },
            { name: "Reminder:", value: `-# If you need help, you may ask in <#1128990603087200276> for assistance.`, inline: false }
        ])

        // Obfuscation Process
        const obfuscation_process: ObfuscationProcess = {
            processes: [],
            embed: null,
            error: null,
            results: null
        }

        obfuscation_process.processes.push(`${GetEmoji("yes")} Buffer completed! (${inlineCode(chunksAmount.toString())} chunks)`)
        obfuscation_process.embed = Embed({
            color: Colors.Yellow,
            timestamp: true,
            fields: [
                { name: `Obfuscation Process:`, value: obfuscation_process.processes[0], inline: false }
            ],
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl",
                iconURL: self.config.icon_url
            }
        })

        // Parse Webhooks
        if (hasWebhook) {
            const webhooks = self.utils.ParseWebhooks(script_content)
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
                if (obfuscation_process.error) return
                let process_id = obfuscation_process.processes.push(process_text); process_id -= 1
                await updateProcess(); const callback_result: ObfuscationResult | Error = await callback(process_id)
                if (callback_result instanceof Error || callback_result?.message) return callback_result
                obfuscation_process.processes[process_id] = process_text_finished
            }
            await createProcess(`${GetEmoji("loading")} Obfuscating script...`, `${GetEmoji("yes")} Script obfuscated!`, async (process_id: number) => {
                obfuscation_process.results = await self.utils.ObfuscateScript(script_content, cmd.message)
                if (!obfuscation_process.results?.code) {
                    obfuscation_process.embed.setColor("Red")
                    obfuscation_process.processes[process_id] = `${GetEmoji("no")} Obfuscation failed!`
                    obfuscation_process.error = obfuscation_process.results.message
                    self.utils.SendErrorMessage("error", cmd, obfuscation_process.error, "Obfuscation Error")
                    return await updateProcess()
                }
                obfuscation_process.processes[process_id] = `${GetEmoji("yes")} Script obfuscated!`
                await updateProcess()
                return obfuscation_process.results
            })
            await createProcess(`${GetEmoji("loading")} Creating file attachment...`, `${GetEmoji("yes")} File attachment created!`, async (process_id: number) => {
                if (!process_id) return
                file_attachment = self.utils.CreateFileAttachment(Buffer.from(obfuscation_process.results.code))
                if (typeof file_attachment != "object") {
                    obfuscation_process.embed.setColor("Red")
                    obfuscation_process.processes[process_id] = `${GetEmoji("no")} Creating file attachment failed!`
                    return await updateProcess()
                }
                obfuscation_process.processes[process_id] = `${GetEmoji("yes")} File attachment created!`
                obfuscation_process.processes["note"] = `-# To customize your obfuscation result, use the ${bold(inlineCode("!customobfuscate"))} command!`
                await updateProcess()
                return obfuscation_process.results
            })

            if (!obfuscation_process.error) {
                console.log(`Script by ${cmd.message.author.username} successfully obfuscated: ${obfuscation_process.results.sessionId}`)
                Database.Increment("bot_statistics", "obfuscations")

                const discord_buttons = [
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel("Open on Website")
                        .setURL(`${self.config.session_url}${obfuscation_process.results.sessionId}`)
                ],
                    row: any = new ActionRowBuilder().addComponents(...[discord_buttons])

                await cmd.message.reply({
                    content: `-# sessionId: \`${obfuscation_process.results.sessionId}\`\n-# took: \`${new Date().getTime() - start_time}ms\``,
                    files: [file_attachment],
                    components: [row]
                })
            }
        })

        return true
    }
}

module.exports = Command