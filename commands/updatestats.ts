import { Colors, PermissionFlagsBits, inlineCode } from "discord.js";
import { statusDisplayController } from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";

class Command {
    name = ["updatestats", "us"]
    category = CommandCategories.Misc
    description = "Forces to update the status display informations."
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    direct_message = false

    callback = async (cmd: cmdStructure) => {
        const embed = Embed({
            description: "Updating status display... Please wait!",
            color: Colors.Yellow,
        })
        await cmd.message.reply({ embeds: [embed] }).then(async msg => {
            await statusDisplayController.Update()
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