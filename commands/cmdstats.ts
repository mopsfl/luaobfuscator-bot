import { Colors } from "discord.js";
import { commandHandler } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import Database from "../modules/Database/Database";
import ErrorHandler from "../modules/ErrorHandler/ErrorHandler";

class CommandConstructor {
    name = ["cmdstats", "cs", "cstats"]
    category = commandHandler.CommandCategories.Misc
    description = "Shows all commands and how many times they were executed."

    callback = async (cmd: Command) => {
        const result = await Database.GetTable<CommandStat[]>("cmd_stats")

        if (!result.success) {
            return ErrorHandler.new({
                message: cmd.message,
                error: `${result.error.code}\n > ${result.error.sqlMessage}`,
                title: "Database Error"
            })
        }

        const embed = Embed({
            title: "Lua Obfuscator - Command Statistics",
            description: "-# Shows all commands and how many times they were executed.",
            color: Colors.Green,
            thumbnail: config.icon_url,
            timestamp: true,
            footer: {
                text: "Lua Obfuscator",
                iconURL: config.icon_url
            },
            fields: []
        })

        const statsMap = new Map(result.data.map(s => [s.command_name, s.call_count ?? 0]));
        [...commandHandler.commands.values()]
            .sort((a, b) => (Number(statsMap.get(b.name[0])) ?? 0) - (Number(statsMap.get(a.name[0])) ?? 0)).forEach(cmd =>
                embed.addFields({
                    name: cmd.name[0],
                    value: `-# ${statsMap.get(cmd.name[0]) ?? 0}`,
                    inline: true
                })
            );

        if (embed.data.fields.length % 3 !== 0) {
            const placeholdersToAdd = 3 - (embed.data.fields.length % 3);
            for (let i = 0; i < placeholdersToAdd; i++) {
                embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
            }
        }

        cmd.message.reply({ embeds: [embed] })
    }
}

export type CommandStat = {
    command_name: string,
    call_count: number
}

module.exports = CommandConstructor