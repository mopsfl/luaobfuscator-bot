import { Colors, hyperlink } from "discord.js";
import { config, utils } from "../../../..";

export default function () {
    return {
        color: Colors.Red,
        timestamp: true,
        description: `${utils.GetEmoji("no")} Process cancelled!`,
        footer: {
            text: `Lua Obfuscator Bot - Custom Obfuscation - made by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}