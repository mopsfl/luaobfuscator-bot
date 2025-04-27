import { Colors, hyperlink } from "discord.js";
import GetEmoji from "../../GetEmoji";
import { config } from "../../../..";

export default function () {
    return {
        color: Colors.Red,
        timestamp: true,
        description: `${GetEmoji("no")} Process cancelled!`,
        footer: {
            text: `Lua Obfuscator Bot - Custom Obfuscation - made by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}