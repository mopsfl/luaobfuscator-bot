import { Colors } from "discord.js";
import { utils } from "../../../index";
import config from "../../../config";

export default function () {
    return {
        title: "Lua Obfuscator - Service Status",
        color: Colors.Grey,
        timestamp: true,
        description: "",
        fields: [
            { name: `${utils.GetEmoji("update")} Last Updated`, value: `-# N/A`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true },
            { name: `${utils.GetEmoji("offline")} Last Outage`, value: `-# N/A`, inline: true },
            { name: "\u200B", value: "**__Services:__**", inline: false },
            { name: "Homepage:", value: `-# N/A`, inline: true },
            { name: "Forum:", value: `-# N/A`, inline: true },
            { name: "API:", value: `-# N/A`, inline: true },
            { name: "\u200B", value: "**__Other Statistics:__**", inline: false },
            { name: "Server Uptime:", value: "-# N/A", inline: true },
            { name: "Memory Usage:", value: "-# N/A", inline: true },
            { name: "Bot Uptime", value: "-# N/A", inline: true },
        ],
        footer: {
            text: `Lua Obfuscator • by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}