import { codeBlock, Colors } from "discord.js";
import config from "../../../config";

export default function () {
    return {
        title: `Error`,
        color: Colors.Red,
        timestamp: true,
        fields: [
            { name: `Message:`, value: codeBlock("Error Message"), inline: false },
        ],
        footer: {
            text: `Lua Obfuscator Bot`,
            iconURL: config.icon_url,
        }
    }
}