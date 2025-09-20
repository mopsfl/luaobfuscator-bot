import { Colors, hyperlink } from "discord.js";
import { config } from "../../../index";
import GetEmoji from "../../GetEmoji";

export default function () {
    return {
        title: "Service Outage Alert",
        color: Colors.Red,
        timestamp: true,
        fields: [
            { name: "Affected Services:", value: `N/A`, inline: false },
            { name: "\u200B", value: "**Outage Information:**", inline: false },
            { name: "Time:", value: "-# N/A", inline: true },
            { name: "ID:", value: "-# N/A", inline: true },
        ],
        footer: {
            text: `Lua Obfuscator - Service Status`,
            iconURL: config.icon_url,
        }
    }
}