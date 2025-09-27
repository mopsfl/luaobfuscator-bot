import { Colors } from "discord.js";
import config from "../../../config";

export default function () {
    return {
        title: "Custom Obfuscation V2 (BETA)",
        color: Colors.Yellow,
        timestamp: true,
        fields: [
            { name: `Process:`, value: ` `, inline: false }
        ],
        footer: {
            text: `Lua Obfuscator Bot - Custom Obfuscation - made by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}