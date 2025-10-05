import { Colors, hyperlink } from "discord.js";
import config from "../../../config";

export default function () {
    return {
        title: "Custom Obfuscation",
        color: Colors.Green,
        timestamp: true,
        description: "",
        fields: [
            { name: `Selected Plugins:`, value: `-# None`, inline: false },
            { name: `Notes:`, value: `-# Read our ${hyperlink("Documentation", config.STATUS_DISPLAY.endpoints.forum + "/docs#plugins")} for more information about each plugin.`, inline: false },
        ],
        footer: {
            text: `Lua Obfuscator Bot - made by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}