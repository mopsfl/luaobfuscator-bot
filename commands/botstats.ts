import { Colors } from "discord.js";
import { commandHandler } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import Database from "../modules/Database/Database";
import ErrorHandler from "../modules/ErrorHandler/ErrorHandler";

class CommandConstructor {
    name = ["botstats", "bs", "bots"]
    category = commandHandler.CommandCategories.Misc
    description = "Shows some statistics about the bot."

    callback = async (cmd: Command) => {
        const result = await Database.GetTable<BotStats[]>("bot_statistics")

        if (!result.success) {
            return ErrorHandler.new({
                message: cmd.message,
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

        cmd.message.reply({ embeds: [embed] })
    }
}

export interface BotStats {
    obfuscations: number,
    total_commands_executed: number,
    deobf_tries: number,
}

module.exports = CommandConstructor