import { Colors, hyperlink, inlineCode } from "discord.js";
import { config, client } from "../index"
import { cmdStructure } from "../modules/Command";
import FormatUptime from "../modules/FormatUptime";
import GithubRepo from "../modules/GithubRepo";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";

class Command {
    name = ["info"]
    category = CommandCategories.Bot
    description = "Shows some informations and statistics about the bot."

    callback = async (cmd: cmdStructure) => {
        let lastCommitInfo = await GithubRepo.GetLastCommitData()
        const embed = Embed({
            title: `LuaObfuscator Bot`,
            description: `Discord Bot made for ${hyperlink("LuaObfuscator", "https://luaobfuscator.com")} to quickly obfuscate lua scripts via discord.`,
            fields: [
                { name: "Links:", value: `${hyperlink("Status Page", 'https://mopsfl.de/status/luaobfuscator')}\n ${hyperlink("Support Server", config.support_url)}`, inline: false },
                { name: "Uptime:", value: `-# ${FormatUptime(client?.uptime)}`, inline: true },
                { name: "discord.js version:", value: `-# ^14.15.3`, inline: true },
                { name: "Last Updated:", value: `-# <t:${lastCommitInfo.last_commit / 1000}:R> [[open]](${lastCommitInfo.commit_url})`, inline: true },
            ],
            color: Colors.Green,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl",
                iconURL: config.icon_url
            },
            thumbnail: config.icon_url
        })
        await cmd.message.reply({ embeds: [embed] })
        return true
    }
}

module.exports = Command