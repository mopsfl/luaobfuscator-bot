import { AttachmentBuilder, bold, Colors, inlineCode, Message } from "discord.js";
import { Command } from "../modules/CommandHandler"
import { commandHandler } from "../index";
import config from "../config";
import Utils from "../modules/Utils";
import ErrorHandler from "../modules/ErrorHandler/ErrorHandler";
import Processing from "../modules/CustomObfuscate/Embeds/Processing";
import Embed from "../modules/Misc/Embed";
import LuaObfuscator from "../modules/LuaObfuscator/API";
import { ObfuscationResult } from "../modules/LuaObfuscator/Types";
import Database from "../modules/Database/Database";
import { randomUUID } from "crypto";

class CommandConstructor {
    name = ["obfuscate", "obf", "obfsc"]
    category = commandHandler.CommandCategories.LuaObfuscator
    description = "Obfuscates your script with the default configurations."
    syntax_usage = "<file | codeblock>"

    callback = async (command: Command) => {
        if (!command.message.channel.isDMBased()) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            return await command.message.reply(`This command is only available in my DM's! ${Utils.GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
        }

        let script_content = "",
            result: ObfuscationResult = null,
            result_attachment: AttachmentBuilder = null,
            response: Message = null,
            session: string = null,
            process_id: string = null,
            process_state: "PROCESSING" | "FINISHED" | "FAILED" = "PROCESSING",
            process_begin: number = null,
            process_embed = Embed(Processing()).setTitle("Script Obfuscation"),
            process_fields = []

        async function UpdateProcessField(message: string, replaceLast = false, failed = false) {
            try {
                let process_content = "",
                    process_value = "",
                    process_time = `${process_begin ? `${Math.max((Date.now() - process_begin) - 1000, 0)}ms` : "N/A"}`

                if (replaceLast) {
                    process_fields = process_fields.slice(0, process_fields.length - 1)
                    process_fields.push(`${failed ? "-" : "+"} ${message}`)
                } else process_fields.push(`${failed ? "-" : "+"} ${message}`)

                process_fields.forEach(text => {
                    process_content += `${text}\n`
                })

                process_value = `\`\`\`diff\n${process_content}\n\`\`\``

                const inputBytes = script_content ? new TextEncoder().encode(script_content).length : 0,
                    outputBytes = result?.code ? new TextEncoder().encode(result.code).length : null,
                    byteDifference = outputBytes && inputBytes ? Utils.FormatBytes(outputBytes - inputBytes) : 0

                process_embed.setFields([
                    { name: "Input:", value: `-# ${Utils.FormatBytes(inputBytes)}`, inline: true },
                    { name: "Output:", value: `-# ${outputBytes ? Utils.FormatBytes(outputBytes) + ` (+ ${byteDifference})` : failed ? "N/A" : Utils.GetEmoji("loading")}`, inline: true },
                    { name: "Obfuscation Type:", value: `-# Default`, inline: true },
                    { name: "Process ID:", value: `-# ${process_id}`, inline: true },
                    { name: "Process State:", value: `-# ${process_state}`, inline: true },
                    { name: "Process Time:", value: `-# ${process_time}`, inline: true },
                    { name: "Session:", value: `-# ${session ? inlineCode(session) + ` [[↗]](${config.session_url + session})` : Utils.GetEmoji("loading")}`, inline: false },
                    { name: `Process:`, value: process_value },
                ])

                if (failed) {
                    process_embed.addFields([
                        {
                            name: "Important Note:",
                            value: `-# Due to how the REST API is implemented, we cannot show the exact error that causes the obfuscation to fail when using the default preset. Please use the custom obfuscation command (${inlineCode("!customobfuscate")}) or the website to receive a detailed error.`,
                            inline: false
                        }
                    ])
                }

                await response?.edit({ embeds: [process_embed] })
                return process_value
            } catch (error) {
                console.error(error)
            }
        }

        await Utils.ParseScriptFromMessage2(command.message).then(async script => {
            process_begin = Date.now()
            script_content = script
            process_id = randomUUID().slice(0, 8)

            await UpdateProcessField("obfuscating script...")
            response = await command.message.reply({ embeds: [process_embed] })

            await LuaObfuscator.v1.Obfuscate(script).then(async _result => {
                result = _result

                if (result.code) {
                    session = result.sessionId
                    await UpdateProcessField("obfuscation completed!\n+ creating file attachment...")
                } else {
                    session = "N/A"
                    process_state = "FAILED"
                    process_embed.setColor(Colors.Red)

                    await UpdateProcessField("obfuscation failed!\n- ↳ unexpected error occurred while obfuscating!", false, true)
                    console.error(`> error while obfuscating script by ${command.user.username} (process: ${process_id})`)
                }
            }).catch(async () => {
                session = "N/A"
                process_state = "FAILED"
                process_embed.setColor(Colors.Red)

                await UpdateProcessField("obfuscation failed!\n- ↳ unexpected error occurred while obfuscating!", false, true)
                console.error(`> error while obfuscating script by ${command.user.username} (process: ${process_id})`)
            })

            if (result?.code) {
                result_attachment = Utils.CreateFileAttachment(Buffer.from(result.code), `${session}.lua`)
                process_state = "FINISHED"
                process_embed.setColor(Colors.Green)

                setTimeout(async () => {
                    UpdateProcessField("file attachment created!")
                    await command.user.send({ files: [result_attachment] })

                    console.log(`> script by ${command.user.username} successfully obfuscated: ${result.sessionId} (process: ${process_id})`)

                    Database.Increment("bot_statistics", "obfuscations")
                }, 1000);
            }
        }).catch(error => {
            return ErrorHandler.new({
                type: "syntax",
                message: command.message,
                error,
                syntax: `${config.prefix}${command.name} <codeblock> | <file>`
            })
        })
    }
}

module.exports = CommandConstructor