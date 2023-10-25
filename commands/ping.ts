import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";

class Command {
    name = ["ping"]
    category = self.commandCategories.Bot
    description = "Returns the bot's current ping in milliseconds, measuring its responsiveness to the Discord server."

    callback = async (cmd: cmdStructure) => {
        const embed = self.Embed({
            description: "Pinging...",
            color: Colors.Yellow
        })
        await cmd.message.reply({ embeds: [embed] }).then(msg => {
            embed.setDescription(`Ping: ${inlineCode((msg.createdTimestamp - new Date().getTime() + "ms").replace(/\-/, ""))}`).setColor(Colors.Green)
            msg.edit({ embeds: [embed] })
        })
        return true
    }
}

module.exports = Command