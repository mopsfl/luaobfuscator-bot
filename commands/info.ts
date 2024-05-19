import { Colors, hyperlink, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import FormatUptime from "../modules/FormatUptime";
import GithubRepo from "../modules/GithubRepo";

class Command {
    name = ["info"]
    category = self.commandCategories.Bot
    description = "Shows some informations and statistics about the bot."

    callback = async (cmd: cmdStructure) => {
        let lastCommitInfo = await GithubRepo.GetLastCommitData()
        const embed = self.Embed({
            title: `LuaObfuscator Bot`,
            description: `Discord Bot made for ${hyperlink("LuaObfuscator", "https://luaobfuscator.com")} to quickly obfuscate lua scripts via discord.`,
            fields: [
                { name: "• Uptime", value: inlineCode(FormatUptime(self.client?.uptime)), inline: true },
                { name: "• Status Page", value: hyperlink("Lua Obfuscator Bot - Status Page", `https://mopsfl.de/status/luaobfuscator`), inline: false },
                { name: "• Support Server", value: `${self.config.support_url}`, inline: false },
                { name: "• discordjs version:", value: `${inlineCode("^14.11.0")}`, inline: true },
                { name: "• Last Repo Update:", value: `<t:${lastCommitInfo.last_commit / 1000}:R> [[open]](${lastCommitInfo.commit_url})`, inline: true },
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