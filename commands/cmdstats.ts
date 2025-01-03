import { Colors, bold, inlineCode, underscore } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database";

class Command {
    name = ["cmdstats", "cs", "cstats"]
    category = CommandCategories.Misc
    description = "Shows the statistics of all commands aka wich command is being used the most."

    callback = async (cmd: cmdStructure) => {
        //const cmd_stats: BotStats = await self.file_cache.getSync("cmd_stats")
        const [cmd_stats, errorCode, errorMessage] = await Database.GetTable("cmd_stats")

        if (errorCode || errorMessage) {
            console.error(errorMessage)
            return self.utils.SendErrorMessage("error", cmd, errorCode)
        }

        let commands_value = ``
        self.command.getAllCommands().forEach(cmd => {
            const stat = cmd_stats.find(s => s.command_name === cmd.name[0])
            commands_value += `${inlineCode(cmd.name[0] + ":")} ${bold(underscore(inlineCode(stat.call_count || "0")))}\n`
        })
        const embed = Embed({
            title: "Lua Obfuscator - Command Statistics",
            color: Colors.Green,
            thumbnail: self.config.icon_url,
            timestamp: true,
            footer: {
                text: "Lua Obfuscator - Command Statistics",
                iconURL: self.config.icon_url
            },
            fields: [
                {
                    name: "Commands:",
                    value: commands_value || `${inlineCode("error")}`,
                    inline: false
                }
            ]
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