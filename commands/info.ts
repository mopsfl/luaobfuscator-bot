import { Colors, hyperlink } from "discord.js";
import { client, commandHandler } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import GithubRepo from "../modules/GithubRepo";
import Embed from "../modules/Embed";
import Utils from "../modules/Utils";

class CommandConstructor {
    name = ["info"]
    category = commandHandler.CommandCategories.Bot
    description = "Shows some informations and statistics about the bot."

    callback = async (cmd: Command) => {
        let lastCommitInfo = await GithubRepo.GetLastCommitData()
        const embed = Embed({
            title: `LuaObfuscator Bot`,
            description: `A Discord bot made for ${hyperlink("luaobfuscator.com", "https://luaobfuscator.com")} to quickly obfuscate lua scripts via discord.`,
            fields: [
                { name: "Links:", value: `${hyperlink("Status Page", 'https://mopsfl.de/status/luaobfuscator')}\n ${hyperlink("Support Server", config.support_url)}`, inline: false },
                { name: "Uptime:", value: `-# ${Utils.FormatUptime(client?.uptime)}`, inline: true },
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
    }
}

module.exports = CommandConstructor