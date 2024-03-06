import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ComponentType, inlineCode, quote, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";

class Command {
    name = ["dropdowntest", "dt"]
    category = self.commandCategories.Misc
    description = "Test command to test discord.js select menus."

    callback = async (cmd: cmdStructure) => {
        const select = new StringSelectMenuBuilder()
            .setCustomId("test")
            .setPlaceholder("Placeholder")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("EncryptStrings")
                    .setDescription("Encrypts all* the strings* some strings with special characters might not be included")
                    .setValue('EncryptStrings'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Minifier')
                    .setDescription('Rename the local variables to v0, v1, v2, etc...')
                    .setValue('Minifier'),
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
                .setStyle(ButtonStyle.Primary)

        const embed = self.Embed({
            title: "Custom Obfuscation - Options",
            fields: [
                { name: "Selected Options:", value: "N/A", inline: false }
            ]
        })
        const row: any = new ActionRowBuilder().addComponents(obfuscate, options),
            response = await cmd.message.reply({ components: [row], embeds: [embed] }),
            collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_00 })
        let total_selected_options = 0,
            _selected_options = []

        collector.on("collect", async i => {
            if (i.customId === "obfuscate") {
                cmd.message.reply("obfuscate")
                i.deferReply()
            } else if (i.customId === "options") {
                var row: any = new ActionRowBuilder().addComponents(select),
                    selectResponse = await response.edit({ components: [row] }),
                    collector = selectResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_00 })

                collector.on("collect", async i => {
                    const selection = i.values[0];
                    if (!_selected_options.includes(selection) && selection !== "nooptionfound" && selection !== "back") {
                        _selected_options.push(selection)
                        if (embed.data.fields[0].value === "N/A") embed.data.fields[0].value = ""
                        total_selected_options++;
                        embed.setFields([
                            { name: "Selected Options:", value: `${embed.data.fields[0].value}\n${total_selected_options}. ${inlineCode(selection)}`, inline: false }
                        ])
                        select.options.splice(select.options.findIndex(s => s.data.value === selection), 1)
                        if (select.options.length <= 0) {
                            select.addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("N/A")
                                    .setValue('nooptionfound')
                            )
                        }
                        var row: any = new ActionRowBuilder().addComponents(select)
                        await response.edit({ embeds: [embed], components: [row] })
                    } else if (selection === "back") {
                        var row: any = new ActionRowBuilder().addComponents(obfuscate, options),
                            selectResponse = await response.edit({ components: [row] })
                    }
                    i.deferReply()
                })
            }
            i.deferUpdate()
        })
        return true
    }
}

module.exports = Command