import { Command, CommandNode } from "../../modules/CommandHandler"
import Embed from "../../modules/Misc/Embed"
import { client, commandHandler } from "../../index"
import { Colors, MessageFlags, SlashCommandBuilder } from "discord.js"
import config from "../../config"

class CommandConstructor implements CommandNode {
    name = ["ping"]
    category = commandHandler.CommandCategories.Bot
    description = "Shows the bot's current latency to Discord."
    slash_command = true

    slashCommandBuilder = new SlashCommandBuilder()
        .setName(this.name[0])
        .setDescription(this.description)

    callback = async (command: Command) => {
        const apiLatency = Math.round(client.ws.ping)
        const embed = Embed({})
            .setTitle("Ping Results")
            .setColor(Colors.Green)
            .setTimestamp()
            .setFields([
                { name: "Response Time", value: `-# ${Date.now() - command.interaction.createdTimestamp}ms`, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "API Latency", value: `-# ${apiLatency > 0 ? `${apiLatency}ms` : "N/A"}`, inline: true },
            ])
            .setFooter({ text: `Lua Obfuscator`, iconURL: config.icon_url })

        await command.interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }
}

module.exports = CommandConstructor