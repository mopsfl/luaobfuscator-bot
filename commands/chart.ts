import { Colors, PermissionFlagsBits, inlineCode } from "discord.js";
import { config } from "../index"
import { cmdStructure } from "../modules/Command";
import ChartImage, { ChartDataset } from "../modules/ChartImage";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";

class Command {
    name = ["chart"]
    category = CommandCategories.Misc
    description = "Creates a temporary chart image with the given dataset. (this is a testing command)"
    direct_message = false
    syntax_usage = "<chart_type> <number> <number> <number> ..."
    permissions = [PermissionFlagsBits.Administrator]
    hidden = true

    callback = async (cmd: cmdStructure) => {
        const datasets_obfuscation_stats: Array<ChartDataset> = [{ "label": "Daily Obfuscations", "data": cmd.arguments.splice(1), "fill": true, "backgroundColor": "rgba(54, 162, 235, 0.8)" }]
        const chart_obfuscation_stats = ChartImage.Create({
            type: cmd.arguments[0].toString(),
            data: {
                labels: ChartImage.GetLocalizedDateStrings(),
                datasets: datasets_obfuscation_stats
            }
        }).height("600").width("1000").bkg("rgb(255,255,255)").toURL()
        cmd.message.reply({
            embeds: [
                Embed({
                    title: "Lua Obfuscator - Statistics",
                    color: Colors.Green,
                    thumbnail: config.icon_url,
                    description: `Live statistics of Lua Obfuscator.`,
                    timestamp: true
                }).setImage(chart_obfuscation_stats).setURL(chart_obfuscation_stats),
            ],
        })
    }
}

module.exports = Command