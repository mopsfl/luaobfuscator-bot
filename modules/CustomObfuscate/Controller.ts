// CustomObfuscate V2
// prob the coolest discord bot thing ive ever made

import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CacheType,
    Colors,
    EmbedBuilder,
    inlineCode,
    InteractionCollector,
    Message,
    SelectMenuComponentOptionData,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    User
} from "discord.js"
import { utils } from "../../index";
import { randomUUID } from "crypto";
import Embed from "../Embed";
import Main from "./Embeds/Main";
import Cancel from "./Embeds/Cancel";
import Processing from "./Embeds/Processing";
import Plugins from "./Plugins";
import Buttons from "./Buttons";
import Database from "../Database/Database";
import LuaObfuscator from "../LuaObfuscator/API";
import { ObfuscationResult } from "../LuaObfuscator/Types";
import { ObfuscationPlugins, CustomObfuscateComponents } from "./Types";

export class CustomObfuscateController {
    constructor(
        public user: User,
        public script_content?: string,
        public plugins?: ObfuscationPlugins,
        public used_plugins = [],
        public saved_configs = {},
        public session?: string,
        public response?: Message,

        public result?: ObfuscationResult,
        public result_attachment?: AttachmentBuilder,

        public process_embed?: EmbedBuilder,
        public process_fields = [],

        public visualize_config = false,

        public main_collector?: InteractionCollector<ButtonInteraction<CacheType>>,
        public plugins_collector?: InteractionCollector<StringSelectMenuInteraction<CacheType>>,
        public components: CustomObfuscateComponents = {
            buttons: {},
            rows: {},
            embeds: {},
            select_menu: null,
            load_menu: null
        },

        public process_begin?: number,
        public process_state: "PROCESSING" | "FINISHED" | "FAILED" = "PROCESSING",
        public last_process_field_update?: number,
        readonly process_id = "",
    ) {
        this.process_id = randomUUID().slice(0, 8)

        this.components.buttons = {
            main: {
                obfuscate: this.CreateButton("Obfuscate", "obfuscate", ButtonStyle.Success, ["update", "1129139085362090145"]),
                configure_plugins: this.CreateButton("Configure Plugins", "configure_plugins", ButtonStyle.Primary, ["edit", "1365040609940869181"]),
                cancel: this.CreateButton("Cancel", "cancel", ButtonStyle.Danger, ["no", "1124835368655659059"]),
            }
        }

        this.components.select_menu = new StringSelectMenuBuilder()
            .setCustomId("plugins_select_menu")
            .setPlaceholder("Select Plugin")
            .addOptions(Plugins.list)

        this.components.load_menu = new StringSelectMenuBuilder()
            .setCustomId("plugins_load_save_menu")
            .setPlaceholder("Select Save")
            .setOptions([{ value: "N_A", description: "N/A", label: "N/A" }])

        this.components.rows = {
            main: new ActionRowBuilder().addComponents(...Object.values(this.components.buttons.main)),
            configure_plugins_select_menu: new ActionRowBuilder().addComponents(this.components.select_menu),
            load_save_select_menu: new ActionRowBuilder().addComponents(this.components.load_menu),
            configure_plugins_buttons: new ActionRowBuilder().addComponents(
                this.CreateButton("Back", "plugins_select_menu_back", ButtonStyle.Secondary, ["arrow_left", "1365631337825832991"]),
                this.CreateButton("Visualize Config", "plugins_select_menu_visualize", ButtonStyle.Secondary, ["data_object", "1365697611478339657"]),
                this.CreateButton("Save Config", "plugins_select_menu_save_config", ButtonStyle.Secondary, ["save", "1365969698218577941"]),
                this.CreateButton("Load Config", "plugins_select_menu_load_config", ButtonStyle.Secondary, ["load", "1365969684570177567"]),
            )
        }

        this.components.embeds = {
            main: Embed(Main()),
            cancelled: Embed(Cancel()),
            processing: Embed(Processing()),
        }

        this.process_embed = this.components.embeds.processing
    }

    public OnButtonClick = async (interaction: ButtonInteraction<CacheType>) => {
        try {
            if (interaction.user.id !== this.user.id) return interaction.deferUpdate();

            switch (interaction.customId) {
                case Buttons.CANCEL:
                    this.main_collector.stop()
                    await this.response.edit({ embeds: [this.components.embeds.cancelled], components: [] })
                    await interaction.deferUpdate()
                    break;
                case Buttons.OBFUSCATE:
                    this.components.rows.main.components.forEach((component: ButtonBuilder) => {
                        component.setDisabled(true)
                        if ("label" in component.data && component.data.label === "Obfuscate") component.setLabel(" ").setEmoji("<:loading:1135544416933785651>")
                    })

                    await interaction.deferUpdate()
                    await this.ProcessObfuscation()
                    break;
                case Buttons.CONFIGURE_PLUGINS:

                    await this.response.edit({ components: [this.components.rows.configure_plugins_select_menu, this.components.rows.configure_plugins_buttons] })
                    await interaction.deferUpdate()
                    break;
                case Buttons.PLUGINS_BACK:
                    await this.response.edit({ components: [this.components.rows.main] })
                    await interaction.deferUpdate()
                    break;
                case Buttons.PLUGINS_VISUALIZE:
                    this.visualize_config = !this.visualize_config
                    this.components.embeds.main.data.fields[0].value = this.GetSelectedPlugins(this.visualize_config)

                    await this.response.edit({ embeds: [this.components.embeds.main], components: [this.components.rows.configure_plugins_select_menu, this.components.rows.configure_plugins_buttons] })
                    await interaction.deferUpdate()
                    break;
                case Buttons.PLUGINS_LOAD:
                    const saved_configs = await this.GetUserConfigSaves()

                    if (saved_configs.length <= 0) {
                        return await interaction.reply({ ephemeral: true, content: "You don't have a saved configuration yet." })
                    }

                    this.components.load_menu.setOptions(saved_configs)

                    await this.response.edit({ components: [this.components.rows.load_save_select_menu, this.components.rows.configure_plugins_buttons] })
                    await interaction.deferUpdate()
                    break;
                case Buttons.PLUGINS_SAVE:
                    await this.SaveCurrentPlugins(interaction)
                    break;
                default:
                    interaction.reply({ ephemeral: true, content: interaction.customId });
                    break;
            }
        } catch (error) {
            console.error(error)
        }
    }

    public OnPluginSelect = async (interaction: StringSelectMenuInteraction<CacheType>) => {
        try {
            if (interaction.user.id !== this.user.id) return interaction.deferUpdate();
            const interaction_value = interaction.values[0]

            if (interaction.customId === "plugins_select_menu") {
                const interaction_index = this.components.select_menu.options.findIndex(option => option.data.value === interaction_value)

                this.components.select_menu.spliceOptions(interaction_index, 1)
                this.components.rows.configure_plugins_select_menu = new ActionRowBuilder().addComponents(this.components.select_menu)

                if (!this.plugins) this.plugins = { MinifiyAll: false, Virtualize: false, CustomPlugins: {} }

                if (this.plugins[interaction_value] !== undefined) {
                    this.plugins[interaction_value] = Plugins.values[interaction_value]
                } else this.plugins.CustomPlugins[interaction_value] = Plugins.values[interaction_value]

                this.used_plugins.push(interaction_value)
                this.components.embeds.main.data.fields[0].value = this.GetSelectedPlugins(this.visualize_config)

                await this.response.edit({ embeds: [this.components.embeds.main], components: [this.components.rows.configure_plugins_select_menu, this.components.rows.configure_plugins_buttons] })
                await interaction.deferUpdate()
            } else if (interaction.customId === "plugins_load_save_menu") {
                const save_id = interaction.values[0],
                    config = JSON.parse(this.saved_configs[save_id])

                this.plugins = config
                this.used_plugins = utils.ObjectKeysToString(this.plugins, true)
                this.components.embeds.main.data.fields[0].value = this.GetSelectedPlugins(this.visualize_config)
                this.components.select_menu.setOptions(Plugins.list)

                this.used_plugins.forEach(plugin_name => {
                    const interaction_index = this.components.select_menu.options.findIndex(option => option.data.value === plugin_name)

                    this.components.select_menu.spliceOptions(interaction_index, 1)
                    this.components.rows.configure_plugins_select_menu = new ActionRowBuilder().addComponents(this.components.select_menu)
                })

                await this.response.edit({ embeds: [this.components.embeds.main], components: [this.components.rows.configure_plugins_select_menu, this.components.rows.configure_plugins_buttons] })
                interaction.deferUpdate();
            }
        } catch (error) {
            console.error(error)
        }
    }

    private ProcessObfuscation = async () => {
        try {
            this.process_begin = new Date().getTime()
            if (!this.plugins) {
                await this.UpdateProcessField("obfuscating script...")
                await LuaObfuscator.v1.Obfuscate(this.script_content).then(async result => {
                    this.result = result
                    if (result.code) {
                        this.session = result.sessionId
                        await this.UpdateProcessField("obfuscation completed!\n+ creating file attachment...")
                    } else {
                        this.session = "N/A"
                        this.process_state = "FAILED"
                        this.process_embed.setColor(Colors.Red)

                        await this.UpdateProcessField("obfuscation failed!\n- ↳ unexpected error occurred while obfuscating!", false, true)
                    }
                }).catch(async err => {
                    this.session = "N/A"
                    this.process_state = "FAILED"
                    this.process_embed.setColor(Colors.Red)

                    await this.UpdateProcessField("obfuscation failed!\n- ↳ unexpected error occurred while obfuscating!", false, true)
                    console.error(err)
                })
            } else {
                await this.UpdateProcessField("initiating obfuscation...")
                await LuaObfuscator.v2.Obfuscate(this.script_content, this.plugins).then(async result => {
                    if (result?.status === "FAILED") {
                        this.session = "N/A"
                        this.process_state = "FAILED"
                        this.process_embed.setColor(Colors.Red)

                        await this.UpdateProcessField(`initiation failed!\n- ↳ ${result.message}`, false, true)
                    } else if (result?.status === "INITIATED") {
                        this.session = result.sessionId

                        await this.UpdateProcessField("obfuscation initiated!\n+ awaiting obfuscation status...")
                        await utils.Sleep(1000)
                        await LuaObfuscator.v2.GetStatus(result.sessionId).then(async status_result => {
                            if (status_result.status === "FINISHED") {
                                this.result = status_result
                                await this.UpdateProcessField("obfuscation completed!\n+ creating file attachment...")
                            } else {
                                this.process_state = "FAILED"
                                this.process_embed.setColor(Colors.Red)
                                await this.UpdateProcessField(`obfuscation failed!\n- ↳ ${status_result.message || "unexpected error occurred while obfuscating!"}`, false, true)
                            }
                        })
                    } else {
                        this.session = "N/A"
                        this.process_state = "FAILED"
                        this.process_embed.setColor(Colors.Red)

                        await this.UpdateProcessField(`initiation failed!\n- ↳ unexpected error occurred while obfuscating!`, false, true)
                    }
                })
            }

            if (this.result?.code) {
                this.result_attachment = utils.CreateFileAttachment(Buffer.from(this.result.code), `${this.session}.lua`)
                this.process_state = "FINISHED"
                this.process_embed.setColor(Colors.Green)

                setTimeout(async () => {
                    this.UpdateProcessField("file attachment created!")
                    await this.user.send({ files: [this.result_attachment] })

                    console.log(`Script by ${this.user.username} successfully obfuscated: ${this.result.sessionId} (process: ${this.process_id})`)

                    Database.Increment("bot_statistics", "obfuscations")
                }, 1000);
            }
        } catch (error) {
            console.error(error)
        }
    }

    private async UpdateProcessField(message: string, replaceLast = false, failed = false) {
        try {
            let process_content = "",
                process_value = "",
                process_time = `${this.process_begin ? `${Math.max((new Date().getTime() - this.process_begin) - 1000, 0)}ms` : "N/A"}`

            if (replaceLast) {
                this.process_fields = this.process_fields.slice(0, this.process_fields.length - 1)
                this.process_fields.push(`${failed ? "-" : "+"} ${message}`)
            } else this.process_fields.push(`${failed ? "-" : "+"} ${message}`)

            this.process_fields.forEach(text => {
                process_content += `${text}\n`
            })

            process_value = `\`\`\`diff\n${process_content}\n\`\`\``

            this.process_embed.setFields([
                { name: "Script:", value: `-# ${utils.FormatBytes(new TextEncoder().encode(this.script_content).length)}`, inline: true },
                { name: "Obfuscation Type:", value: `-# ${!this.plugins ? "Default" : "Custom"}`, inline: true },
                { name: "Process ID:", value: `-# ${this.process_id}`, inline: true },
                { name: "Process State:", value: `-# ${this.process_state}`, inline: true },
                { name: "Process Time:", value: `-# ${process_time}`, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "Session:", value: `-# ${this.session ? inlineCode(this.session) : utils.GetEmoji("loading")}`, inline: false },
                { name: `Process:`, value: process_value },
            ])

            await this.response.edit({ embeds: [this.process_embed], components: this.process_state === "PROCESSING" ? [this.components.rows.main] : [] })

            return process_value
        } catch (error) {
            console.error(error)
        }
    }

    private CreateButton(label: string, id: string, buttonStyle: ButtonStyle, emoji?: string[]) {
        const button = new ButtonBuilder().setLabel(label).setCustomId(id).setStyle(buttonStyle)
        if (emoji) button.setEmoji(`<:${emoji[0]}:${emoji[1]}>`)

        return button
    }

    private GetSelectedPlugins(visualize_config = false) {
        if (!this.plugins && !visualize_config) return `-# None`
        if (visualize_config) return `\`\`\`json\n${utils.ObjectToFormattedString(this.plugins || {}, 0, true)}\n\`\`\``

        let str = "-# "

        this.used_plugins.forEach((plugin_name, index, array) => {
            str += `${plugin_name}${index === array.length - 1 ? "" : ", "}`;
        });

        return str
    }

    private async SaveCurrentPlugins(interaction: ButtonInteraction<CacheType>) {
        try {
            if (!this.plugins) return await interaction.deferUpdate();

            let user_saves = {},
                save_id = randomUUID(),
                current_config = JSON.stringify(this.plugins);

            if (!await Database.RowExists("customplugin_saves", { userid: this.user.id })) {
                await Database.Insert("customplugin_saves", { userid: this.user.id, plugins: "{}" })
            } else {
                const result = await Database.GetTable("customplugin_saves", { userid: this.user.id })
                if (!result.success) {
                    console.error(`Failed to get saved plugins. ${result.error.message}`);
                    return interaction.reply({ ephemeral: true, content: `${"Failed to save configuration!"}\n-# Error: get_${result.error.code}_${result.error.status}` })
                } else {
                    user_saves = JSON.parse(result.data.plugins) || {}
                }
            }

            user_saves[save_id] = current_config

            const result = await Database.Update(
                "customplugin_saves",
                { plugins: JSON.stringify(user_saves) },
                { userid: this.user.id }
            );


            if (!result.success) {
                console.error(`Failed to get save configuration. ${result.error.message}`);
                return interaction.reply({ ephemeral: true, content: `${"Failed to save configuration!"}\n-# Error: get_${result.error.code}_${result.error.status}` })
            } else {
                return interaction.reply({ ephemeral: true, content: `Plugins saved successfully!\n-# id: ${save_id}` })
            }
        } catch (error) {
            console.error(error)
        }
    }

    private async GetUserConfigSaves(): Promise<Array<SelectMenuComponentOptionData>> {
        try {
            if (!await Database.RowExists("customplugin_saves", { userid: this.user.id })) return [];
            const result = await Database.GetTable("customplugin_saves", { userid: this.user.id }),
                configs: Array<SelectMenuComponentOptionData> = []

            if (!result.success) {
                console.error(`Failed to get saved plugins. ${result.error.message}`);
                return []
            }

            this.saved_configs = JSON.parse(result.data.plugins || "{}")

            Object.keys(this.saved_configs).forEach((save_id, index) => {
                configs.push({
                    value: save_id,
                    label: `Save ${index + 1}`,
                    description: utils.ObjectKeysToString(JSON.parse(this.saved_configs[save_id])).toString().slice(0, 100)
                })
            })

            return configs
        } catch (error) {
            console.error(error)
        }
    }
}