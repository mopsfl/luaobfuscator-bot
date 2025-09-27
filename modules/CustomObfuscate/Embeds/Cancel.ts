import { Colors } from "discord.js";
import config from "../../../config";
import Utils from "../../Utils";

export default function () {
    return {
        color: Colors.Red,
        timestamp: true,
        description: `${Utils.GetEmoji("no")} Process cancelled!`,
        footer: {
            text: `Lua Obfuscator Bot - Custom Obfuscation - made by mopsfl`,
            iconURL: config.icon_url,
        }
    }
}