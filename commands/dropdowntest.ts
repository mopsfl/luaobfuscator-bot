import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, Colors, ComponentType, inlineCode, quote, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";

class Command {
    name = ["dropdowntest", "dt"]
    category = self.commandCategories.Misc
    description = "Test command to test discord.js select menus."

    callback = async (cmd: cmdStructure) => {
        const select = new StringSelectMenuBuilder()
            .setCustomId("select_options")
            .setPlaceholder("Select an option")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("Basic Minimal")
                    .setDescription("Basic Minimal")
                    .setValue('basicminimal'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Basic Good')
                    .setDescription('Basic Good')
                    .setValue('basicgood'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Obfuscate')
                    .setDescription('Obfuscate')
                    .setValue('obfuscate'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Chaotic Good')
                    .setDescription('Chaotic Good')
                    .setValue('chaoticgood'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Chaotic Evil')
                    .setDescription('Chaotic Evil')
                    .setValue('chaoticevil'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Back')
                    .setValue('back')
                    .setEmoji("<:update:1129139085362090145>")
            ),
            obfuscate = new ButtonBuilder()
                .setLabel("Obfuscate")
                .setCustomId("obfuscate")
                .setStyle(ButtonStyle.Success),
            options = new ButtonBuilder()
                .setLabel("Customize Options")
                .setCustomId("options")
                .setStyle(ButtonStyle.Primary),
            cancel = new ButtonBuilder()
                .setLabel("Cancel")
                .setCustomId("cancel")
                .setStyle(ButtonStyle.Danger)

        const embed = self.Embed({
            color: Colors.Green,
            timestamp: true,
            title: "Custom Obfuscation",
            fields: [
                { name: "Script Session:", value: inlineCode("N/A"), inline: false },
                { name: "Selected Options:", value: inlineCode("N/A"), inline: false },
            ],
            footer: {
                text: `Lua Obfuscator Bot`,
                iconURL: self.config.icon_url,
            }
        })
        let row_buttons: any = new ActionRowBuilder().addComponents(obfuscate, options, cancel),
            row_options: any = new ActionRowBuilder().addComponents(select),
            response = await cmd.message.reply({ components: [row_buttons], embeds: [embed] }),
            collector_mainButtons = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_00 })

        try {
            collector_mainButtons.on("collect", async i => {
                switch (i.customId) {
                    case "obfuscate":
                        row_buttons.components.forEach((c: ButtonBuilder) => {
                            c.setDisabled(true)
                            if (c.data.label === "Obfuscate") c.setEmoji("<:loading:1135544416933785651>").setLabel(" ")
                        })
                        await response.edit({ components: [row_buttons] })
                        await i.reply("obfuscate")
                        break;
                    case "cancel":
                        embed.data.fields = []
                        embed.setDescription("Obfuscation cancelled.").setColor(Colors.Red).setTitle(" ")
                        response.edit({ components: [], embeds: [embed] }).then(() => {
                            setTimeout(() => {
                                response.deletable && response.delete()
                            }, 5000);
                        })
                        collector_mainButtons.stop()
                        break;
                    case "options":
                        i.deferUpdate()
                        var response_options = await response.edit({ components: [row_options] }),
                            collector_options = response_options.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_00 })

                        collector_options.on("collect", async i_options => {
                            const selection = i_options.values[0]
                            switch (selection) {
                                case "back":
                                    response.edit({ components: [row_buttons] })
                                    await i_options.deferUpdate()
                                    collector_options.stop()
                                    break;
                                default:
                                    const optionIndex = select.options.findIndex(o => o.data.value === selection)
                                    select.spliceOptions(optionIndex, 1)
                                    row_options = new ActionRowBuilder().addComponents(select)

                                    if (embed.data.fields[1].value === "`N/A`") embed.data.fields[1].value = ""
                                    embed.data.fields[1].value = embed.data.fields[1].value + `\n${inlineCode(selection)}`

                                    response.edit({ embeds: [embed], components: [row_options] })
                                    await i_options.deferUpdate()
                                    break;
                            }
                        })
                        break;
                    default:
                        break;
                }
            })
        } catch (error) {
            console.error(error)
        }
        return true
    }
}

module.exports = Command