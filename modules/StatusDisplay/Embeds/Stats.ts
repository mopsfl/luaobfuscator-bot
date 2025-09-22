import { Colors, hyperlink } from "discord.js";
import { config } from "../../../index";

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
            text: `Lua Obfuscator - Service Status • by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}