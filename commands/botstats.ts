import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";

class Command {
    name = ["botstats", "bs", "bots"]
    category = CommandCategories.Bot
    description = "Shows you some bot statistics."

    callback = async (cmd: cmdStructure) => {
        const bot_stats: BotStats = await self.file_cache.getSync("bot_stats")
        const embed = Embed({
            title: "Lua Obfuscator - Bot Statistics",
            color: Colors.Green,
            thumbnail: self.config.icon_url,
            timestamp: true,
            footer: {
                text: "Lua Obfuscator - Bot Statistics"
            },
            fields: [
                {
                    name: "Statistics:",
                    value: `
                        ${inlineCode("Obfuscations:")} ${inlineCode(bot_stats.obfuscations.toString())}
                        ${inlineCode("Executed Commands:")} ${inlineCode(bot_stats.total_commands_executed.toString())}
                        ${inlineCode("Retards that tried deobf:")} ${inlineCode(bot_stats.total_monkey_deobfuscations.toString())}
                    `,
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