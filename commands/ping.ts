import { bold, Colors } from "discord.js";
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Embed";
import { client, commandHandler } from "../index";
import config from "../config";
import Utils from "../modules/Utils";

class CommandConstructor {
    name = ["ping"]
    category = commandHandler.CommandCategories.Bot
    description = "Shows the bot's current latency to Discord."

    callback = async (command: Command) => {
        const embed = Embed({ description: "Pinging...", color: Colors.Yellow }),
            apiLatency = Math.round(client.ws.ping)

        await command.message.reply({ embeds: [embed.setDescription(`${Utils.GetEmoji("loading")} Pinging...`)] }).then(sent => {
            embed.setTitle("Ping Results")
                .setColor(Colors.Green)
                .setDescription(" ")
                .setTimestamp()
                .setFields([
                    { name: "Response Time", value: `-# ${Date.now() - command.message.createdTimestamp}ms`, inline: true },
                    { name: "\u200B", value: "\u200B", inline: true },
                    { name: "API Latency", value: `-# ${apiLatency > 0 ? `${apiLatency}ms` : "N/A"}`, inline: true },
                ])
                .setFooter({ text: `Lua Obfuscator`, iconURL: config.icon_url })

            sent.edit({ embeds: [embed] });
        });
    }
}

module.exports = CommandConstructor