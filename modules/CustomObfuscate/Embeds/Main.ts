import { Colors, hyperlink } from "discord.js";
import GetEmoji from "../../GetEmoji";
import { config } from "../../..";

export = {
    title: "Custom Obfuscation V2 (BETA)",
    color: Colors.Green,
    timestamp: true,
    description: "",
    fields: [
        { name: `Selected Plugins:`, value: `-# None`, inline: false },
        { name: `Notes:`, value: `-# Read our ${hyperlink("Documentation", config.STATUS_DISPLAY.endpoints.forum + "/docs#plugins")} for more information about each plugin.`, inline: false },
    ],
    footer: {
        text: `Lua Obfuscator Bot - Custom Obfuscation - made by mopsfl`,
        iconURL: config.icon_url,
    }
}