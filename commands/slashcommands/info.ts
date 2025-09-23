import { Colors, hyperlink, SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import Embed from '../../modules/Embed';
import GithubRepo from '../../modules/GithubRepo';
import { client, utils } from '../../index';
import config from "../../config";
import Database from '../../modules/Database/Database';

const command = {
    name: ["info"],
    commandId: "info_slash",
    slash_command: true,
    data: new SlashCommandBuilder()
        .setName('info')
        .setDMPermission(true)
        .setDescription("Shows some informations and statistics about the bot."),
    async callback(interaction: CommandInteraction): Promise<void> {
        let lastCommitInfo = await GithubRepo.GetLastCommitData()
        const embed = Embed({
            title: `LuaObfuscator Bot`,
            description: `Discord Bot made for ${hyperlink("LuaObfuscator", "https://luaobfuscator.com")} to quickly obfuscate lua scripts via discord.`,
            fields: [
                { name: "Links:", value: `${hyperlink("Status Page", 'https://mopsfl.de/status/luaobfuscator')}\n ${hyperlink("Support Server", config.support_url)}`, inline: false },
                { name: "Uptime:", value: `-# ${utils.FormatUptime(client?.uptime)}`, inline: true },
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

        Database.Increment("cmd_stats", "call_count", { command_name: "info" }).catch(console.error)
        await interaction.reply({ ephemeral: true, embeds: [embed] })
    },
};


export { command };
