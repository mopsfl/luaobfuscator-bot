import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";

class Command {
    name = ["cmdstats", "cs", "cstats"]
    category = self.commandCategories.Misc
    description = "Shows stats of all commands."

    callback = async (cmd: cmdStructure) => {
        const cmd_stats: BotStats = await self.file_cache.getSync("cmd_stats")
        let commands_value = ``
        self.command.getAllCommands().forEach(cmd => {
            commands_value += `${inlineCode(cmd.name[0] + ":")} ${inlineCode(cmd_stats[cmd.name[0]] || "0")}\n`
        })
        const embed = self.Embed({
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