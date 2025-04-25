import { Colors, hyperlink, inlineCode, SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import Embed from '../../modules/Embed';
import GithubRepo from '../../modules/GithubRepo';
import FormatUptime from '../../modules/FormatUptime';
import { config, client } from '../..';

const command = {
    name: ["info"],
    commandId: "info_slash",
    slash_command: true,
    data: new SlashCommandBuilder()
        .setName('info')
        .setDMPermission(true)
        .setDescription("Returns the bot's current ping in milliseconds, measuring its responsiveness to the Discord server."),
    async callback(interaction: CommandInteraction): Promise<void> {
        let lastCommitInfo = await GithubRepo.GetLastCommitData()
        const embed = Embed({
            title: `LuaObfuscator Bot`,
            description: `Discord Bot made for ${hyperlink("LuaObfuscator", "https://luaobfuscator.com")} to quickly obfuscate lua scripts via discord.`,
            fields: [
                { name: "• Uptime", value: inlineCode(FormatUptime(client?.uptime)), inline: true },
                { name: "• Status Page", value: hyperlink("Lua Obfuscator Bot - Status Page", `https://mopsfl.de/status/luaobfuscator`), inline: false },
                { name: "• Support Server", value: `${config.support_url}`, inline: false },
                { name: "• discordjs version:", value: `${inlineCode("^14.15.3")}`, inline: true },
                { name: "• Last Repo Update:", value: `<t:${lastCommitInfo.last_commit / 1000}:R> [[open]](${lastCommitInfo.commit_url})`, inline: true },
            ],
            color: Colors.Green,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl",
                iconURL: config.icon_url
            },
            thumbnail: config.icon_url
        })
        await interaction.reply({ embeds: [embed], ephemeral: true })
    },
};


export { command };
