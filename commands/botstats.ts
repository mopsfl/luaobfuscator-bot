import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database";

class Command {
    name = ["botstats", "bs", "bots"]
    category = CommandCategories.Bot
    description = "Shows you some bot statistics."

    callback = async (cmd: cmdStructure) => {
        //const bot_stats: BotStats = await self.file_cache.getSync("bot_stats")
        const [bot_stats, errorCode, errorMessage] = await Database.GetTable("bot_statistics")

        if (errorCode || errorMessage) {
            console.error(errorMessage)
            return self.utils.SendErrorMessage("error", cmd, errorCode)
        }

        const _bot_stats: BotStats = bot_stats[0]
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
                        ${inlineCode("Obfuscations:")} ${inlineCode(_bot_stats.obfuscations.toString())}
                        ${inlineCode("Executed Commands:")} ${inlineCode(_bot_stats.total_commands_executed.toString())}
                        ${inlineCode("Retards that tried deobf:")} ${inlineCode(_bot_stats.deobf_tries.toString())}
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
    deobf_tries: number,
}

module.exports = Command