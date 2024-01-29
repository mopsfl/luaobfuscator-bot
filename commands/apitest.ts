import { Colors, PermissionFlagsBits, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";

class Command {
    name = ["apitest"]
    category = self.commandCategories.Misc
    description = "Makes a test request to the luaobfuscator bot api."
    permissions = [PermissionFlagsBits.Administrator]
    direct_message = true

    callback = async (cmd: cmdStructure) => {
        const embed = self.Embed({
            description: `${GetEmoji("loading")} API test going on... Results will be sent to your dm's.`,
            color: Colors.Yellow,
            timestamp: true,
            footer: {
                text: `Lua Obfuscator Bot`,
                iconURL: self.config.icon_url,
            }
        })
        await cmd.message.reply({ embeds: [embed] }).then(async msg => {
            const _pingStart = new Date().getTime()
            await fetch(process.env.SERVER).then(async res => {
                embed.setDescription(`${GetEmoji("yes")} API test finished. Results have been sent to your dm's.`).setColor(Colors.Green)
                msg.edit({ embeds: [embed] })
                embed.setDescription(`${GetEmoji("yes")} **API Ping:**
                > Url: ${inlineCode(process.env.SERVER)}
                > Ping: ${inlineCode((new Date().getTime() - _pingStart + "ms").replace(/\-/, ""))}
                > Type: ${inlineCode(res.type)}
                ${GetEmoji("yes")} **Response:**
                > ${res.ok === true ? GetEmoji("yes") : GetEmoji("no")} OK: ${inlineCode(res.ok === true ? "true" : "false")}
                > ${res.ok === true ? GetEmoji("yes") : GetEmoji("no")} Response Code: ${inlineCode(res.status.toString())} - ${inlineCode(res.statusText)}
                `).setTitle("API Test Results")
                cmd.message.author.send({ embeds: [embed] })
            })
        })
        return true
    }
}

module.exports = Command