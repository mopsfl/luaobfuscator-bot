// buggy as fuck ;-;
import { AttachmentBuilder, codeBlock, SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import { utils, command as _command } from '../../index';
import GetEmoji from '../../modules/GetEmoji';
import Database from '../../modules/Database';
import LuaObfuscator from '../../modules/LuaObfuscator/API';

const command = {
    name: ["obfuscate"],
    commandId: "obfuscate_slash",
    slash_command: true,
    data: new SlashCommandBuilder()
        .setName('obfuscate')
        .setDMPermission(true)
        .setDescription('Obfuscates your given input using the REST API with the default preset.'),
    async callback(interaction: CommandInteraction): Promise<void> {
        if (!interaction.channel.isDMBased()) {
            await interaction.reply({
                content: "This command is only available in DM's!",
                ephemeral: true,
            }); return
        }

        const existsInCmdStats = await Database.RowExists("cmd_stats", { command_name: command.commandId })
        if (!existsInCmdStats) {
            console.log(`${command.commandId} cmd not registered in database yet. inserting...`);
            await Database.Insert("cmd_stats", { command_name: command.commandId, call_count: 1 })
        } else {
            const [db_success, db_errorCode, db_errorMessage] = await Database.Increment("cmd_stats", "call_count", { command_name: command.commandId })
            if (!db_success) console.error(db_errorMessage)
        }

        const [db_success, db_errorCode, db_errorMessage] = await Database.Increment("bot_statistics", "total_commands_executed")
        if (!db_success) console.error(db_errorMessage)

        await interaction.reply({
            content: `Please upload a valid Lua script as a file, or paste it here inside a code block.`,
            ephemeral: true
        }).then(interactionReply => {
            interaction.channel.awaitMessages({ filter: (m) => m.author.id === interaction.user.id, max: 1, time: 60_000, errors: ["time"] }).then(async msg => {
                let message = msg.first()
                let script_content = "",
                    chunksAmount = 0,
                    hasWebhook = false,
                    raw_arguments = _command.getRawArgs(message),
                    hasCodeBlock = utils.HasCodeblock(raw_arguments),
                    file_attachment: AttachmentBuilder,
                    start_time = new Date().getTime()

                // Get Script Content
                if (hasCodeBlock) {
                    hasWebhook = utils.HasWebhook(raw_arguments)
                    script_content = utils.ParseCodeblock(raw_arguments)
                } else if ([...message.attachments].length > 0) {
                    const attachment = message.attachments.first()
                    const url = attachment?.url
                    if (!url) utils.SendErrorMessage("error", ({ message: message } as any), "Unable to get url from attachment.")
                    await fetch(url).then(async res => {
                        const chunks = await utils.ReadAllChunks(res.body)
                        chunksAmount = chunks.length
                        chunks.forEach(chunk => {
                            script_content += Buffer.from(chunk).toString() || ""
                        })
                    })
                } else {
                    interactionReply.delete()
                    return utils.SendErrorMessage("syntax", ({ message: message } as any), "Please provide a valid Lua script as a codeblock or a file.", null, [
                        { name: "Reminder:", value: `If you need help, you may ask in <#1128990603087200276> for assistance.`, inline: false }
                    ])
                }

                // Parse Webhooks
                if (hasWebhook) {
                    const webhooks = utils.ParseWebhooks(script_content)
                    let webhook_string = ""
                    for (let i = 0; i < webhooks.length; i++) {
                        const webhook = webhooks[i].trim();
                        if (!webhook_string.includes(webhook)) {
                            webhook_string += codeBlock("lua", webhook)
                        }
                    }
                }

                interaction.followUp({ content: `${GetEmoji("loading")} Obfuscation in progress! This should only take a few seconds...`, ephemeral: true }).then(async processReply => {
                    interactionReply.delete()
                    await LuaObfuscator.v1.Obfuscate(script_content, message).then(async res => {
                        if (res.message) return utils.SendErrorMessage("error", ({ message: message } as any), res.message, "Obfuscation Error")
                        console.log(`Script by ${message.author.username} successfully obfuscated: ${res.sessionId} (slash command)`)
                        Database.Increment("bot_statistics", "obfuscations")

                        file_attachment = utils.CreateFileAttachment(Buffer.from(res.code))
                        if (typeof file_attachment != "object") {
                            return utils.SendErrorMessage("error", ({ message: message } as any), "An unexpected error occurred while creating the file attachment!", "Obfuscation Error")
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
    },
};

export { command };
