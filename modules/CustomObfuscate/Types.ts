import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js"

export type CustomObfuscateComponents = {
    buttons?: {
        main?: { obfuscate: ButtonBuilder, configure_plugins: ButtonBuilder, cancel: ButtonBuilder },
    },
    rows: CustomObfuscateRows,
    embeds: CustomObfuscateEmbeds,
    select_menu?: StringSelectMenuBuilder,
    load_menu?: StringSelectMenuBuilder
}

export type CustomObfuscateRows = {
    main?: ActionRowBuilder<any>,
    configure_plugins_select_menu?: ActionRowBuilder<any>,
    configure_plugins_buttons?: ActionRowBuilder<any>,
    load_save_select_menu?: ActionRowBuilder<any>,
}
export type CustomObfuscateEmbeds = {
    main?: EmbedBuilder,
    cancelled?: EmbedBuilder,
    processing?: EmbedBuilder
}

export type ObfuscationPlugins = { MinifiyAll: false, Virtualize: false, CustomPlugins: {} }
export type UserConfigSave = { userid: string, plugins: string }