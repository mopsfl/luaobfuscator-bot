import { Colors } from "discord.js";
import { command, config, utils } from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database/Database";

class Command {
    name = ["cmdstats", "cs", "cstats"]
    category = CommandCategories.Misc
    description = "Shows the statistics of all commands aka wich command is being used the most."

    callback = async (cmd: cmdStructure) => {
        const result = await Database.GetTable("cmd_stats")

        if (!result.success) {
            console.error(result.error.message)
            return utils.SendErrorMessage("error", cmd, result.error.code)
        }

        const embed = Embed({
            title: "Lua Obfuscator - Command Statistics",
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

        [...command.getAllCommands().values()]
            .sort((a, b) =>
                (Number(statsMap.get(b.name[0])) ?? 0) - (Number(statsMap.get(a.name[0])) ?? 0)
            ).forEach(cmd =>
                embed.addFields({
                    name: cmd.name[0],
                    value: `-# ${statsMap.get(cmd.name[0]) ?? 0}`,
                    inline: true
                })
            );


        cmd.message.reply({ embeds: [embed] })
        return true
    }
}

export interface BotStats {
    obfuscations: number,
    total_commands_executed: number,
    total_monkey_deobfuscations: number,
}

module.exports = Command