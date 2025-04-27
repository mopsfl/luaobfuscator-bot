import { bold, Colors, ComponentType, inlineCode, SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import Embed from '../../modules/Embed';
import GetEmoji from '../../modules/GetEmoji';
import { CustomObfuscateController } from '../../modules/CustomObfuscate/Controller';
import { utils, command as _command } from '../../index';

const command = {
    name: ["customobfuscate"],
    commandId: "custom_obfuscate",
    slash_command: true,
    data: new SlashCommandBuilder()
        .setName('customobfuscate')
        .setDMPermission(true)
        .setDescription("Obfuscates your given input using the REST API with your selected plugins."),
    async callback(interaction: CommandInteraction): Promise<void> {
        if (!interaction.channel.isDMBased()) {
            await interaction.reply({
                content: "This command is only available in DM's!",
                ephemeral: true,
            }); return
        }

        await interaction.reply({
            content: `Please upload a valid Lua script as a file, or paste it here inside a code block.`,
            ephemeral: true
        }).then(interactionReply => {
            interaction.channel.awaitMessages({ filter: (m) => m.author.id === interaction.user.id, max: 1, time: 60_000, errors: ["time"] }).then(async msg => {
                let message = msg.first()
                utils.ParseScriptFromMessage({
                    raw_arguments: _command.getRawArgs(message),
                    message: message,
                    used_command_name: command.name[0],
                    slash_command: true
                }).then(async script => {
                    const Controller = new CustomObfuscateController(interaction.user)

                    Controller.script_content = script
                    Controller.response = await interaction.channel.send({ components: [Controller.components.rows.main], embeds: [Controller.components.embeds.main] })
                    Controller.main_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 })
                    Controller.plugins_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 120000 })

                    Controller.main_collector.on("collect", Controller.OnButtonClick.bind(this))
                    Controller.plugins_collector.on("collect", Controller.OnPluginSelect.bind(this))
                }).catch(err => {
                    interactionReply.delete()
                    console.error(`unable to create custom obfuscation process for ${interaction.user.username}! (${err})`)
                })
            })
        })
    },
};

export { command };
