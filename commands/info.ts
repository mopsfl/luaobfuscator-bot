import { Colors, hyperlink, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import FormatUptime from "../modules/FormatUptime";

class Command {
    name = ["info"]
    category = self.commandCategories.Bot
    description = "Shows some informations and statistics about the bot."

    callback = async (cmd: cmdStructure) => {
        const embed = self.Embed({
            title: `LuaObfuscator Bot`,
            description: `Discord Bot made for ${hyperlink("LuaObfuscator", "https://luaobfuscator.com")} to quickly obfuscate lua scripts via discord.`,
            fields: [
                { name: "• Uptime", value: inlineCode(FormatUptime(self.client?.uptime)), inline: true },
                { name: "• Status Page", value: hyperlink("Lua Obfuscator Bot - Status Page", `https://mopsfl.de/status/luaobfuscator`), inline: false },
                { name: "• Support Server", value: `${self.config.support_url}`, inline: false },
            ],
            color: Colors.Green,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl",
                iconURL: self.config.icon_url
            },
            thumbnail: self.config.icon_url
        })
        await cmd.message.reply({ embeds: [embed] })
        return true
    }
}

module.exports = Command