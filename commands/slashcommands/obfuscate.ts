// TODO: remake this cuz its absolutely horrible messy

import { Command, CommandNode } from "../../modules/CommandHandler"
import { commandHandler } from "../../index"
import { AttachmentBuilder, Colors, inlineCode, Message, MessageFlags, SlashCommandBuilder } from "discord.js"
import LuaObfuscator from "../../modules/LuaObfuscator/API"
import Database from "../../modules/Database/Database"
import Utils from "../../modules/Utils"
import ErrorHandler from "../../modules/ErrorHandler/ErrorHandler"
import config from "../../config"
import Embed from "../../modules/Misc/Embed"
import Processing from "../../modules/CustomObfuscate/Embeds/Processing"
import { ObfuscationResult } from "../../modules/LuaObfuscator/Types"
import { randomUUID } from "crypto"

class CommandConstructor implements CommandNode {
    name = ["obfuscate"]
    category = commandHandler.CommandCategories.Bot
    description = "Obfuscates your script with the default configurations."
    slash_command = true

    slashCommandBuilder = new SlashCommandBuilder()
        .setName(this.name[0])
        .setDescription(this.description)

    callback = async (command: Command) => {
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

                process_embed.setFields([
                    { name: "Script:", value: `-# ${Utils.FormatBytes(new TextEncoder().encode(script_content).length)}`, inline: true },
                    { name: "Obfuscation Type:", value: `-# Default`, inline: true },
                    { name: "Process ID:", value: `-# ${process_id}`, inline: true },
                    { name: "Process State:", value: `-# ${process_state}`, inline: true },
                    { name: "Process Time:", value: `-# ${process_time}`, inline: true },
                    { name: "\u200B", value: "\u200B", inline: true },
                    { name: "Session:", value: `-# ${session ? inlineCode(session) : Utils.GetEmoji("loading")}`, inline: false },
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

        await command.interaction.reply({
            content: `Please upload a valid Lua script as a file, or paste it here inside a code block.`,
            flags: [MessageFlags.Ephemeral]
        }).then(interactionReply => {
            command.interaction.channel.awaitMessages({ filter: (m) => m.author.id === command.interaction.user.id, max: 1, time: 60_000, errors: ["time"] }).then(async msg => {
                let message = msg.first()

                await Utils.ParseScriptFromMessage2(message).then(async script => {
                    process_begin = Date.now()
                    script_content = script
                    process_id = randomUUID().slice(0, 8)

                    await UpdateProcessField("obfuscating script...")
                    response = await command.interaction.followUp({ embeds: [process_embed] })

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
                            console.error(`> error while obfuscating script by ${command.user.username} (process: ${process_id}) (slash)`)
                        }
                    }).catch(async err => {
                        session = "N/A"
                        process_state = "FAILED"
                        process_embed.setColor(Colors.Red)

                        await UpdateProcessField("obfuscation failed!\n- ↳ unexpected error occurred while obfuscating!", false, true)
                        console.error(`> error while obfuscating script by ${command.user.username} (process: ${process_id}) (slash)`)
                    })

                    if (result?.code) {
                        result_attachment = Utils.CreateFileAttachment(Buffer.from(result.code), `${session}.lua`)
                        process_state = "FINISHED"
                        process_embed.setColor(Colors.Green)

                        setTimeout(async () => {
                            UpdateProcessField("file attachment created!")
                            await command.user.send({ files: [result_attachment] })

                            console.log(`> script by ${command.user.username} successfully obfuscated: ${result.sessionId} (process: ${process_id}) (slash)`)

                            Database.Increment("bot_statistics", "obfuscations")
                        }, 1000);
                    }
                }).catch(error => {
                    console.error(`> error while obfuscating script by ${command.user.username} (process: ${process_id}) (slash)`)
                    return ErrorHandler.new({
                        type: "syntax",
                        interaction: command.interaction,
                        error,
                        syntax: `${config.prefix}${command.name} <codeblock> | <file>`
                    })
                })

            }).catch(() => {
                interactionReply.delete()
            })
        })
    }
}

module.exports = CommandConstructor