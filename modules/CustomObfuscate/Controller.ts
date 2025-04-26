// TODO: customize plugins
//       not related to this but use the same process embed for the !obfuscate commmand (looks cooler)

import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, codeBlock, Colors, EmbedBuilder, inlineCode, InteractionCollector, Message, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js"
import { cmdStructure } from "../../modules/Command";
import { config, utils } from "../../index";
import { randomUUID } from "crypto";
import Embed from "../Embed";
import GetEmoji from "../GetEmoji";
import Main from "./Embeds/Main";
import Cancel from "./Embeds/Cancel";
import Processing from "./Embeds/Processing";
import FormatBytes from "../FormatBytes";
import { ObfuscationResult } from "../Utils";
import Plugins from "./Plugins";

export class CustomObfuscateController {
    constructor(
        public command: cmdStructure,
        public script_content?: string,
        public plugins?: ObfuscationPlugins,
        public used_plugins = [],
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
                customize_plugins: this.CreateButton("Customize Plugins", "customize_plugins", ButtonStyle.Primary, ["edit", "1365040609940869181"]),
                cancel: this.CreateButton("Cancel", "cancel", ButtonStyle.Danger, ["no", "1124835368655659059"]),
            }
        }

        this.components.select_menu = new StringSelectMenuBuilder()
            .setCustomId("plugins_select_menu")
            .setPlaceholder("Select Plugin")
            .addOptions(Plugins.list)

        this.components.rows = {
            main: new ActionRowBuilder().addComponents(...Object.values(this.components.buttons.main)),
            customize_plugins_select_menu: new ActionRowBuilder().addComponents(this.components.select_menu),
            customize_plugins_buttons: new ActionRowBuilder().addComponents(
                this.CreateButton("Back", "plugins_select_menu_back", ButtonStyle.Secondary, ["arrow_left", "1365631337825832991"]),
                this.CreateButton("Visualize Config", "plugins_select_menu_visualize", ButtonStyle.Secondary, ["data_object", "1365697611478339657"]),
            )
        }

        this.components.embeds = {
            main: Embed(Main),
            cancelled: Cancel,
            processing: Processing,
        }

        this.process_embed = Embed(this.components.embeds.processing)
    }

    public OnButtonClick = async (interaction: ButtonInteraction<CacheType>) => {
        if (interaction.user.id !== this.command.message.author.id) return interaction.deferUpdate();

        switch (interaction.customId) {
            case "cancel":
                this.main_collector.stop()
                await this.response.edit({ embeds: [Embed(this.components.embeds.cancelled)], components: [] })
                await interaction.deferUpdate()
                break;
            case "obfuscate":
                this.components.rows.main.components.forEach((component: ButtonBuilder) => {
                    component.setDisabled(true)
                    if (component.data.label == "Obfuscate") component.setLabel(" ").setEmoji("<:loading:1135544416933785651>")
                })

                await interaction.deferUpdate()
                await this.ProcessObfuscation()
                break;
            case "customize_plugins":
                await this.response.edit({ components: [this.components.rows.customize_plugins_select_menu, this.components.rows.customize_plugins_buttons] })
                await interaction.deferUpdate()
                break;
            case "plugins_select_menu_back":
                await this.response.edit({ components: [this.components.rows.main] })
                await interaction.deferUpdate()
                break;
            case "plugins_select_menu_visualize":
                this.visualize_config = !this.visualize_config
                this.components.embeds.main.data.fields[0].value = this.GetSelectedPlugins(this.visualize_config)

                await this.response.edit({ embeds: [this.components.embeds.main], components: [this.components.rows.customize_plugins_select_menu, this.components.rows.customize_plugins_buttons] })
                await interaction.deferUpdate()
                break;
            default:
                interaction.reply({ ephemeral: true, content: interaction.customId });
                break;
        }
    }

    public OnPluginSelect = async (interaction: StringSelectMenuInteraction<CacheType>) => {
        if (interaction.user.id !== this.command.message.author.id) return interaction.deferUpdate();
        const plugin_name = interaction.values[0],
            interaction_index = this.components.select_menu.options.findIndex(option => option.data.value === plugin_name)

        this.components.select_menu.spliceOptions(interaction_index, 1)
        this.components.rows.customize_plugins_select_menu = new ActionRowBuilder().addComponents(this.components.select_menu)

        if (!this.plugins) this.plugins = { MinifiyAll: false, Virtualize: false, CustomPlugins: {} }

        if (this.plugins[plugin_name] !== undefined) {
            this.plugins[plugin_name] = Plugins.values[plugin_name]
        } else this.plugins.CustomPlugins[plugin_name] = Plugins.values[plugin_name]

        this.used_plugins.push(plugin_name)
        this.components.embeds.main.data.fields[0].value = this.GetSelectedPlugins(this.visualize_config)

        await this.response.edit({ embeds: [this.components.embeds.main], components: [this.components.rows.customize_plugins_select_menu, this.components.rows.customize_plugins_buttons] })
        await interaction.deferUpdate()
    }

    private ProcessObfuscation = async () => {
        this.process_begin = new Date().getTime()
        if (!this.plugins) {
            await this.UpdateProcessField("obfuscating script...")
            await utils.ObfuscateScript(this.script_content).then(async result => {
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
            await utils.ManualObfuscateScriptV2(this.script_content, this.plugins).then(async result => {
                if (result?.status === "FAILED") {
                    this.session = "N/A"
                    this.process_state = "FAILED"
                    this.process_embed.setColor(Colors.Red)

                    await this.UpdateProcessField(`initiation failed!\n- ↳ ${result.message}`, false, true)
                } else if (result?.status === "INITIATED") {
                    this.session = result.sessionId

                    await this.UpdateProcessField("obfuscation initiated!\n+ awaiting obfuscation status...")
                    await utils.GetV2ObfuscationStatus(result.sessionId).then(async status_result => {
                        if (status_result.status === "FINISHED") {
                            this.result = status_result
                            await this.UpdateProcessField("obfuscation completed!\n+ creating file attachment...")
                        } else {
                            this.process_state = "FAILED"
                            this.process_embed.setColor(Colors.Red)
                            await this.UpdateProcessField(`obfuscation failed!\n- ↳ ${status_result.message}`, false, true)
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
                await this.command.message.author.send({ files: [this.result_attachment] })
            }, 200);
        }
    }

    private async UpdateProcessField(message: string, replaceLast = false, failed = false) {
        let process_content = "",
            process_value = "",
            process_time = `${this.process_begin ? `${Math.max((new Date().getTime() - this.process_begin) - 100, 0)}ms` : "N/A"}`

        if (replaceLast) {
            this.process_fields = this.process_fields.slice(0, this.process_fields.length - 1)
            this.process_fields.push(`${failed ? "-" : "+"} ${message}`)
        } else this.process_fields.push(`${failed ? "-" : "+"} ${message}`)

        this.process_fields.forEach(text => {
            process_content += `${text}\n`
        })

        process_value = `\`\`\`diff\n${process_content}\n\`\`\``

        this.process_embed.setFields([
            { name: "Script:", value: `-# ${FormatBytes(new TextEncoder().encode(this.script_content).length)}`, inline: true },
            { name: "Obfuscation Type:", value: `-# ${!this.plugins ? "Default" : "Custom"}`, inline: true },
            { name: "Process ID:", value: `-# ${this.process_id}`, inline: true },
            { name: "Process State:", value: `-# ${this.process_state}`, inline: true },
            { name: "Process Time:", value: `-# ${process_time}`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true },
            { name: "Session:", value: `-# ${this.session ? inlineCode(this.session) : GetEmoji("loading")}`, inline: false },
            { name: `Process:`, value: process_value },
        ])

        await this.response.edit({ embeds: [this.process_embed], components: this.process_state === "PROCESSING" ? [this.components.rows.main] : [] })

        return process_value
    }

    private CreateButton(label: string, id: string, buttonStyle: ButtonStyle, emoji?: string[]) {
        const button = new ButtonBuilder().setLabel(label).setCustomId(id).setStyle(buttonStyle)
        if (emoji) button.setEmoji(`<:${emoji[0]}:${emoji[1]}>`)

        return button
    }

    private GetSelectedPlugins(visualize_config = false) {
        if (!this.plugins) return `-# None`
        if (visualize_config) return `\`\`\`json\n${utils.ObjectToFormattedString(this.plugins, 0, true)}\n\`\`\``

        let str = "-# "

        this.used_plugins.forEach((plugin_name, index, array) => {
            str += `${plugin_name}${index === array.length - 1 ? "" : ", "}`;
        });

        return str
    }
}

export type CustomObfuscateComponents = {
    buttons?: {
        main?: { obfuscate: ButtonBuilder, customize_plugins: ButtonBuilder, cancel: ButtonBuilder },
    },
    rows: CustomObfuscateRows,
    embeds: CustomObfuscateEmbeds,
    select_menu?: StringSelectMenuBuilder
}

export type CustomObfuscateRows = { main?: ActionRowBuilder<any>, customize_plugins_select_menu?: ActionRowBuilder<any>, customize_plugins_buttons?: ActionRowBuilder<any> }
export type CustomObfuscateEmbeds = {
    main?: EmbedBuilder,
    cancelled?: Object,
    processing?: Object
}

export type ObfuscationPlugins = { MinifiyAll: false, Virtualize: false, CustomPlugins: {} }