import { bold, codeBlock, Colors, inlineCode } from "discord.js";
import { utils, config } from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Database from "../modules/Database/Database";

class Command {
    name = ["nohello", "nh", "nhs"]
    category = CommandCategories.Misc
    description = "Shows you some bot statistics."

    callback = async (cmd: cmdStructure) => {
        const result = await Database.GetTable("nohello_stats")

        if (!result.success) {
            console.error(result.error.message)
            return utils.SendErrorMessage("error", cmd, result.error.code)
        }

        const noHelloStats: NoHelloStats = result.data[0]
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
                { name: "No Hello Triggers:", value: `-# ${noHelloStats?.nohello_count || "N/A"}`, inline: true },
                { name: "Dont Ping Triggers:", value: `-# ${noHelloStats?.noping_count || "N/A"}`, inline: true },
                { name: "Note:", value: `\`\`\`diff\n- ${"No Hello is currently disabled because it crashes the bot sometimes and I'm to lazy to fix it. :(\n\`\`\`"}`, inline: false },
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