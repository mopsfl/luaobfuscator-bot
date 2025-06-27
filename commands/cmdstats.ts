import { Colors } from "discord.js";
import { command, config, utils } from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database";

class Command {
    name = ["cmdstats", "cs", "cstats"]
    category = CommandCategories.Misc
    description = "Shows the statistics of all commands aka wich command is being used the most."

    callback = async (cmd: cmdStructure) => {
        const [cmd_stats, errorCode, errorMessage] = await Database.GetTable("cmd_stats")

        if (errorCode || errorMessage) {
            console.error(errorMessage)
            return utils.SendErrorMessage("error", cmd, errorCode)
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

        command.getAllCommands().forEach(cmd => {
            const stat = cmd_stats.find((s: any) => s.command_name === cmd.name[0])
            embed.addFields({
                name: cmd.name[0],
                value: `-# ${(stat.call_count || "0")}`,
                inline: true
            })
        })

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