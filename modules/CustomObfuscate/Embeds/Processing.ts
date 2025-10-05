import { Colors } from "discord.js";
import config from "../../../config";

export default function () {
    return {
        title: "Custom Obfuscation",
        color: Colors.Yellow,
        timestamp: true,
        fields: [
            { name: `Process:`, value: ` `, inline: false }
        ],
        footer: {
            text: `Lua Obfuscator Bot - made by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}