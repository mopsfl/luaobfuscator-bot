import { Colors, inlineCode } from "discord.js";
import { utils } from "../index"
import config from "../config";
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database/Database";

class Command {
    name = ["botstats", "bs", "bots"]
    category = CommandCategories.Misc
    description = "Shows you some bot statistics."

    callback = async (cmd: cmdStructure) => {
        const result = await Database.GetTable("bot_statistics")

        if (!result.success) {
            console.error(result.error.message)
            return utils.SendErrorMessage("error", cmd, result.error.code)
        }

        const bot_stats: BotStats = result.data[0]
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
                { name: "Obfuscations:", value: `-# ${bot_stats?.obfuscations || "N/A"}`, inline: true },
                { name: "Executed Commands:", value: `-# ${bot_stats?.total_commands_executed || "N/A"}`, inline: true },
                { name: "Retards that tried deobf:", value: `-# ${bot_stats?.deobf_tries || "N/A"}`, inline: true }
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