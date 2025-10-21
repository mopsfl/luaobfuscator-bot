import { Colors } from "discord.js";
import config from "../../../config";

export default function () {
    return {
        title: `Service Outage Alert`,
        thumbnail: "https://cdn.discordapp.com/emojis/1129006428535918643.png",
        color: Colors.Red,
        timestamp: true,
        fields: [
            { name: "\u200B", value: "**__Services:__**", inline: false },
            { name: "Homepage:", value: `-# N/A`, inline: true },
            { name: "Forum:", value: `-# N/A`, inline: true },
            { name: "API:", value: `-# N/A`, inline: true },
            { name: "\u200B", value: "**Outage Information:**", inline: false },
            { name: "Started:", value: "-# N/A", inline: true },
            { name: "Ended:", value: "-# N/A", inline: true },
            { name: "Duration:", value: "-# N/A", inline: true },
            { name: "Outage ID:", value: "-# N/A", inline: false }
        ],
        footer: {
            text: `Lua Obfuscator`,
            iconURL: config.icon_url,
        }
    }
}