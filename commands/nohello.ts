import { bold, Colors } from "discord.js";
import { commandHandler } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import Database from "../modules/Database/Database";
import ErrorHandler from "../modules/ErrorHandler/ErrorHandler";

class CommandConstructor {
    name = ["nohello", "nh", "nhs"]
    category = commandHandler.CommandCategories.Misc
    description = "Shows you statistics about the No Hello plugin."

    callback = async (cmd: Command) => {
        const result = await Database.GetTable("nohello_stats")

        if (!result.success) {
            console.error(result.error.message)
            return ErrorHandler.new({
                message: cmd.message,
                error: `${result.error.code}\n > ${result.error.sqlMessage}`,
                title: "Database Error"
            })
        }

        const noHelloStats: NoHelloStats = result.data[0]
        const embed = Embed({
            title: "Lua Obfuscator - No Hello Statistics",
            description: `-# A statistic of how many times the good old ${bold("No Hello")} has been triggered by users.`,
            color: Colors.Green,
            thumbnail: config.icon_url,
            timestamp: true,
            footer: {
                iconURL: config.icon_url,
                text: "Lua Obfuscator"
            },
            fields: [
                { name: "No Hello Triggers:", value: `-# ${noHelloStats?.nohello_count || "N/A"}`, inline: true },
                { name: "Dont Ping Triggers:", value: `-# ${noHelloStats?.noping_count || "N/A"}`, inline: true },
                { name: "Note:", value: `\`\`\`diff\n- ${"No Hello is currently disabled because it crashes the bot sometimes and I'm to lazy to fix it. :(\n\`\`\`"}`, inline: false },
            ]
        })

        cmd.message.reply({ embeds: [embed] })
    }
}

export interface NoHelloStats {
    nohello_count: number,
    noping_count: number,
}

module.exports = CommandConstructor