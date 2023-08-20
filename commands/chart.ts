import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import { ChartDataset } from "../modules/ChartImage";

class Command {
    name = ["chart"]
    category = self.commandCategories.Misc
    description = "Creates a chart image with the given information."
    direct_message = false

    callback = async (cmd: cmdStructure) => {
        const datasets_obfuscation_stats: Array<ChartDataset> = [{ "label": "Daily Obfuscations", "data": cmd.arguments.splice(1), "fill": true, "backgroundColor": "rgba(54, 162, 235, 0.8)" }]
        const chart_obfuscation_stats = self.chartImage.Create({
            type: cmd.arguments[0].toString(),
            data: {
                labels: self.chartImage.GetLocalizedDateStrings(),
                datasets: datasets_obfuscation_stats
            }
        }).height("600").width("1000").bkg("rgb(255,255,255)").toURL()
        cmd.message.reply({
            embeds: [
                self.Embed({
                    title: "Lua Obfuscator - Statistics",
                    color: Colors.Green,
                    thumbnail: self.config.icon_url,
                    description: `Live statistics of Lua Obfuscator.`,
                    timestamp: true
                }).setImage(chart_obfuscation_stats).setURL(chart_obfuscation_stats),
            ],
        })
    }
}

module.exports = Command