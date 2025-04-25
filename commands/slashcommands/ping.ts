import { Colors, inlineCode, SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import Embed from '../../modules/Embed';

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
            embed.setDescription(`Ping: ${inlineCode((msg.createdTimestamp - new Date().getTime() + "ms").replace(/\-/, ""))}`).setColor(Colors.Green)
            msg.edit({ embeds: [embed] })
        })
    },
};

export { command };
