import { Command, CommandNode } from "../../modules/CommandHandler"
import Embed from "../../modules/Misc/Embed"
import { commandHandler } from "../../index"
import { Colors, MessageFlags, SlashCommandBuilder } from "discord.js"
import config from "../../config"
import Database from "../../modules/Database/Database"
import { BotStats } from "../botstats"
import ErrorHandler from "../../modules/ErrorHandler/ErrorHandler"

class CommandConstructor implements CommandNode {
    name = ["botstats"]
    category = commandHandler.CommandCategories.Misc
    description = "Shows some statistics about the bot."
    slash_command = true

    slashCommandBuilder = new SlashCommandBuilder()
        .setName(this.name[0])
        .setDescription(this.description)

    callback = async (command: Command) => {
        const result = await Database.GetTable<BotStats[]>("bot_statistics")

        if (!result.success) {
            return ErrorHandler.new({
                message: command.message,
                error: `${result.error.code}\n > ${result.error.sqlMessage}`,
                title: "Database Error"
            })
        }

        const embed = Embed({
            title: "Lua Obfuscator - Bot Statistics",
            color: Colors.Green,
            thumbnail: config.icon_url,
            timestamp: true,
            footer: {
                text: "Lua Obfuscator",
                iconURL: config.icon_url,
            },
            fields: [
                { name: "Obfuscations:", value: `-# ${result.data[0]?.obfuscations || "N/A"}`, inline: true },
                { name: "Executed Commands:", value: `-# ${result.data[0]?.total_commands_executed || "N/A"}`, inline: true },
                { name: "Retards that tried deobf:", value: `-# ${result.data[0]?.deobf_tries || "N/A"}`, inline: true }
            ]
        })

        await command.interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] })
    }
}

module.exports = CommandConstructor