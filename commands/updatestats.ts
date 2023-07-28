import { Colors, PermissionFlagsBits, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";

class Command {
    name = ["updatestats", "us"]
    description = "Forces to update update the status display informations."
    permissions = [PermissionFlagsBits.Administrator]

    callback = async (cmd: cmdStructure) => {
        const embed = self.Embed({
            description: "Updating status display... Please wait!",
            color: Colors.Yellow,
        })
        await cmd.message.reply({ embeds: [embed] }).then(async msg => {
            await self.statusDisplay.UpdateDisplayStatus()
            embed.setDescription(`${GetEmoji("yes")} Status display updated! (took ${inlineCode(`${Math.round(new Date().getTime() - cmd.timestamp)}ms`)})`)
                .setColor(Colors.Green)
                .setTimestamp()
                .setFooter({ text: `${cmd.id}` })
            msg.edit({ embeds: [embed] })
        })
        return true
    }
}

module.exports = Command