import { SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import Database from '../../modules/Database/Database';

const command = {
    name: ["deobfuscate"],
    commandId: "deobfuscate_slash",
    slash_command: true,
    data: new SlashCommandBuilder()
        .setName('deobfuscate')
        .setDMPermission(true)
        .setDescription("Deobfuscates a obfuscated script!! real!i!!i!"),
    async callback(interaction: CommandInteraction): Promise<void> {
        await interaction.reply({ content: "Sorry, this ain't Luraph! :man_shrugging:", ephemeral: true })
        await Database.Increment("bot_statistics", "deobf_tries")
    },
};

export { command };
