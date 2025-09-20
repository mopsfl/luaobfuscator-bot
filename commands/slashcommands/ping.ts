import { Colors, SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import Embed from '../../modules/Embed';
import Database from '../../modules/Database/Database';

const command = {
    name: ["ping"],
    commandId: "ping_slash",
    slash_command: true,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDMPermission(true)
        .setDescription("Returns the bot's current ping in milliseconds, measuring its responsiveness to the Discord server."),
    async callback(interaction: CommandInteraction): Promise<void> {
        const embed = Embed({
            description: "Pinging...",
            color: Colors.Yellow
        })

        await interaction.reply({ embeds: [embed], ephemeral: true }).then(msg => {
            embed.setFields([{ name: "Result:", value: `-# ${(msg.createdTimestamp - new Date().getTime() + "ms").replace(/\-/, "")}` }])
                .setDescription(" ")
                .setTimestamp()
                .setColor(Colors.Green)

            msg.edit({ embeds: [embed] })
        })

        Database.Increment("cmd_stats", "call_count", { command_name: "ping" }).catch(console.error)
    },
};

export { command };
