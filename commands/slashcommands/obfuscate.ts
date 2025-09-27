// TODO: remake this cuz its absolutely horrible messy

import { Command, CommandNode } from "../../modules/CommandHandler"
import { commandHandler } from "../../index"
import { AttachmentBuilder, MessageFlags, SlashCommandBuilder } from "discord.js"
import LuaObfuscator from "../../modules/LuaObfuscator/API"
import Database from "../../modules/Database/Database"
import Utils from "../../modules/Utils"

class CommandConstructor implements CommandNode {
    name = ["obfuscate"]
    category = commandHandler.CommandCategories.Bot
    description = "Obfuscates your given input using the REST API with the default preset."
    slash_command = true

    slashCommandBuilder = new SlashCommandBuilder()
        .setName(this.name[0])
        .setDescription(this.description)

    callback = async (command: Command) => {
        await command.interaction.reply({
            content: `Please upload a valid Lua script as a file, or paste it here inside a code block.`,
            ephemeral: true
        }).then(interactionReply => {
            command.interaction.channel.awaitMessages({ filter: (m) => m.author.id === command.interaction.user.id, max: 1, time: 60_000, errors: ["time"] }).then(async msg => {
                let message = msg.first()
                let script_content = "",
                    chunksAmount = 0,
                    raw_arguments = "",//_command.getRawArgs(message),
                    hasCodeBlock = Utils.HasCodeblock(raw_arguments),
                    file_attachment: AttachmentBuilder,
                    start_time = new Date().getTime()

                // Get Script Content
                if (hasCodeBlock) {
                    script_content = Utils.ParseCodeblock(message.content)
                } else if ([...message.attachments].length > 0) {
                    const attachment = message.attachments.first()
                    const url = attachment?.url
                    if (!url) Utils.SendErrorMessage("error", ({ message: message } as any), "Unable to get url from attachment.")
                    await fetch(url).then(async res => {
                        const chunks = await Utils.ReadAllChunks(res.body)
                        chunksAmount = chunks.length
                        chunks.forEach(chunk => {
                            script_content += Buffer.from(chunk).toString() || ""
                        })
                    })
                } else {
                    interactionReply.delete()
                    return Utils.SendErrorMessage("syntax", ({ message: message } as any), "Please provide a valid Lua script as a codeblock or a file.", null, [
                        { name: "Reminder:", value: `If you need help, you may ask in <#1128990603087200276> for assistance.`, inline: false }
                    ])
                }

                command.interaction.followUp({ content: `${Utils.GetEmoji("loading")} Obfuscation in progress! This should only take a few seconds...`, flags: [MessageFlags.Ephemeral] }).then(async processReply => {
                    interactionReply.delete()
                    await LuaObfuscator.v1.Obfuscate(script_content, message).then(async res => {
                        if (res.message) return Utils.SendErrorMessage("error", ({ message: message } as any), res.message, "Obfuscation Error")
                        console.log(`Script by ${message.author.username} successfully obfuscated: ${res.sessionId} (slash command)`)
                        Database.Increment("bot_statistics", "obfuscations")

                        file_attachment = Utils.CreateFileAttachment(Buffer.from(res.code))
                        if (typeof file_attachment != "object") {
                            return Utils.SendErrorMessage("error", ({ message: message } as any), "An unexpected error occurred while creating the file attachment!", "Obfuscation Error")
                        }

                        await message.reply({
                            content: `-# sessionId: \`${res.sessionId}\`\n-# took: \`${new Date().getTime() - start_time}ms\``,
                            files: [file_attachment],
                        })
                    })
                })
            }).catch(() => {
                interactionReply.delete()
            })
        })
    }
}

module.exports = CommandConstructor