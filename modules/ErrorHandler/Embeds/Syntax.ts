import { codeBlock, Colors, inlineCode } from "discord.js";
import config from "../../../config";
import Utils from "../../Utils";

export default function () {
    return {
        title: `${Utils.GetEmoji("no")} Syntax Error`,
        color: Colors.Red,
        description: codeBlock("Message"),
        timestamp: true,
        fields: [
            { name: `Syntax:`, value: `-# ${inlineCode("!example <example>")}`, inline: false },
            { name: `Reminder:`, value: `-# If you need help, you may ask in <#1112349917483106387> for assistance.`, inline: false },
        ],
        footer: {
            text: `Lua Obfuscator Bot`,
            iconURL: config.icon_url,
        }
    }
}