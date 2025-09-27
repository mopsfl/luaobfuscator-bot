import { Colors, inlineCode } from "discord.js";
import config from "../../../config";
import Utils from "../../Utils";

export default function () {
    return {
        title: `${Utils.GetEmoji("offline")} Lua Obfuscator - Outage History`,
        color: Colors.Green,
        timestamp: true,
        description: "",
        fields: [
            { name: `Services`, value: `-# N/A`, inline: true },
            { name: "Status", value: `-# N/A`, inline: true },
            { name: `Time`, value: `-# N/A`, inline: true },
            { name: "\u200B", value: `-# You can see the full outage history on the [website](http://localhost:6969/outagehistory).`, inline: false }
        ],
        footer: {
            text: `Lua Obfuscator • by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}