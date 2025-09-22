import { Colors } from "discord.js";
import { config, utils } from "../../../index";

export default function () {
    return {
        title: `${utils.GetEmoji("offline")} Lua Obfuscator - Outage History`,
        color: Colors.Green,
        timestamp: true,
        description: "",
        fields: [
            { name: `Services`, value: `-# N/A`, inline: true },
            { name: "Status", value: `-# N/A`, inline: true },
            { name: `Time`, value: `-# N/A`, inline: true },
        ],
        footer: {
            text: `Lua Obfuscator • by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}