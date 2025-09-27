// TODO: remake

import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, Colors, bold, codeBlock, inlineCode } from "discord.js";
import { Command } from "../modules/CommandHandler";
import { commandHandler } from "../index"
import config from "../config";
import Utils, { ObfuscationProcess } from "../modules/Utils";
import Embed from "../modules/Embed";
import Database from "../modules/Database/Database";
import LuaObfuscator from "../modules/LuaObfuscator/API";
import { ObfuscationResult } from "../modules/LuaObfuscator/Types";

class CommandConstructor {
    name = ["obfuscate", "obf", "obfsc"]
    category = commandHandler.CommandCategories.LuaObfuscator
    description = "Obfuscates your given input using the REST API with the default preset."
    syntax_usage = "<file | codeblock>"

    callback = async (command: Command) => {
        if (!command.message.channel.isDMBased()) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            await command.message.reply(`no, use website: ${bold(config.STATUS_DISPLAY.endpoints.homepage)} or slide in my dms ${Utils.GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
            return true
        }

        let script_content = "",
            chunksAmount = 0,
            hasCodeBlock = Utils.HasCodeblock(command.message.content),
            file_attachment: AttachmentBuilder,
            start_time = Date.now()

        // Get Script Content
        if (hasCodeBlock) {
            script_content = Utils.ParseCodeblock(command.message.content)
        } else if ([...command.message.attachments].length > 0) {
            const attachment = command.message.attachments.first()
            const url = attachment?.url
            if (!url) Utils.SendErrorMessage("error", command, "Unable to get url from attachment.")
            await fetch(url).then(async res => {
                const chunks = await Utils.ReadAllChunks(res.body)
                chunksAmount = chunks.length
                chunks.forEach(chunk => {
                    script_content += Buffer.from(chunk).toString() || ""
                })
            })
        } else return Utils.SendErrorMessage("syntax", command, "Please provide a valid Lua script as a codeblock or a file.", null, [
            { name: "Syntax:", value: inlineCode(`${config.prefix}${command.name} <codeblock> | <file>`), inline: false },
            { name: "Reminder:", value: `-# If you need help, you may ask in <#1128990603087200276> for assistance.`, inline: false }
        ])

        // Obfuscation Process
        const obfuscation_process: ObfuscationProcess = {
            processes: [],
            embed: null,
            error: null,
            results: null
        }

        obfuscation_process.processes.push(`${Utils.GetEmoji("yes")} Buffer completed! (${inlineCode(chunksAmount.toString())} chunks)`)
        obfuscation_process.embed = Embed({
            color: Colors.Yellow,
            timestamp: true,
            fields: [
                { name: `Obfuscation Process:`, value: obfuscation_process.processes[0], inline: false }
            ],
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl",
                iconURL: config.icon_url
            }
        })

        await command.message.reply({ embeds: [obfuscation_process.embed] }).then(async msg => {
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
            await createProcess(`${Utils.GetEmoji("loading")} Obfuscating script...`, `${Utils.GetEmoji("yes")} Script obfuscated!`, async (process_id: number) => {
                obfuscation_process.results = await LuaObfuscator.v1.Obfuscate(script_content, command.message)
                if (!obfuscation_process.results?.code) {
                    obfuscation_process.embed.setColor("Red")
                    obfuscation_process.processes[process_id] = `${Utils.GetEmoji("no")} Obfuscation failed!`
                    obfuscation_process.error = obfuscation_process.results.message
                    Utils.SendErrorMessage("error", command, obfuscation_process.error, "Obfuscation Error")
                    return await updateProcess()
                }
                obfuscation_process.processes[process_id] = `${Utils.GetEmoji("yes")} Script obfuscated!`
                await updateProcess()
                return obfuscation_process.results
            })
            await createProcess(`${Utils.GetEmoji("loading")} Creating file attachment...`, `${Utils.GetEmoji("yes")} File attachment created!`, async (process_id: number) => {
                if (!process_id) return
                file_attachment = Utils.CreateFileAttachment(Buffer.from(obfuscation_process.results.code))
                if (typeof file_attachment != "object") {
                    obfuscation_process.embed.setColor("Red")
                    obfuscation_process.processes[process_id] = `${Utils.GetEmoji("no")} Creating file attachment failed!`
                    return await updateProcess()
                }
                obfuscation_process.processes[process_id] = `${Utils.GetEmoji("yes")} File attachment created!`
                obfuscation_process.processes["note"] = `-# To customize your obfuscation result, use the ${bold(inlineCode("!customobfuscate"))} command!`
                await updateProcess()
                return obfuscation_process.results
            })

            if (!obfuscation_process.error) {
                console.log(`> script by ${command.message.author.username} successfully obfuscated: ${obfuscation_process.results.sessionId}`)
                Database.Increment("bot_statistics", "obfuscations")

                const discord_buttons = [
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel("Open on Website")
                        .setURL(`${config.session_url}${obfuscation_process.results.sessionId}`)
                ],
                    row: any = new ActionRowBuilder().addComponents(...[discord_buttons])

                await command.message.reply({
                    content: `-# sessionId: \`${obfuscation_process.results.sessionId}\`\n-# took: \`${Date.now() - start_time}ms\``,
                    files: [file_attachment],
                    components: [row]
                })
            }
        })
    }
}

module.exports = CommandConstructor