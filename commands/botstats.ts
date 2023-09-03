import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";

class Command {
    name = ["botstats", "bs", "bots"]
    category = self.commandCategories.Bot
    description = "Returns the bot's stats."

    callback = async (cmd: cmdStructure) => {
        const bot_stats: BotStats = await self.file_cache.getSync("bot_stats")
        const embed = self.Embed({
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
    total_commands_executed: number
}

module.exports = Command