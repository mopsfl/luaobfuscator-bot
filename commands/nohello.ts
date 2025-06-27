import { bold, Colors, inlineCode } from "discord.js";
import { utils, config } from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database";

class Command {
    name = ["nohello", "nh", "nhs"]
    category = CommandCategories.Misc
    description = "Shows you some bot statistics."

    callback = async (cmd: cmdStructure) => {
        const [bot_stats, errorCode, errorMessage] = await Database.GetTable("nohello_stats")

        if (errorCode || errorMessage) {
            console.error(errorMessage)
            return utils.SendErrorMessage("error", cmd, errorCode)
        }

        const _noHelloStats: NoHelloStats = bot_stats[0]
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
                { name: "No Hello Triggers:", value: `-# ${_noHelloStats.nohello_count}`, inline: true },
                { name: "Dont Ping Triggers:", value: `-# ${_noHelloStats.noping_count}`, inline: true },
            ]
        })

        cmd.message.reply({ embeds: [embed] })
        return true
    }
}

export interface NoHelloStats {
    nohello_count: number,
    noping_count: number,
}

module.exports = Command