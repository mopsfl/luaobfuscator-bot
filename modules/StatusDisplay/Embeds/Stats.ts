import { Colors, hyperlink } from "discord.js";
import config from "../../../config";

export default function () {
    return {
        title: "Lua Obfuscator - Statistics",
        color: Colors.Green,
        timestamp: true,
        description: "",
        fields: [
            { name: `Total Obfuscations:`, value: `-# N/A`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true },
            { name: `Recent Obfuscations:`, value: `-# N/A`, inline: true },
        ],
        footer: {
            text: `Lua Obfuscator • by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}