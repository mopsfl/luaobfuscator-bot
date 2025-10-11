import { Colors, PermissionFlagsBits, inlineCode } from "discord.js";
import { commandHandler, statusDisplayController } from "../index"
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import Utils from "../modules/Utils";

class CommandConstructor {
    name = ["updatestats", "us"]
    category = commandHandler.CommandCategories.Misc
    description = "Requests an update of the status display."
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    direct_message = false

    callback = async (cmd: Command) => {
        const embed = Embed({
            description: `${Utils.GetEmoji("loading")} Updating status display... Please wait!`,
            color: Colors.Yellow,
        })

        await cmd.message.reply({ embeds: [embed] }).then(async msg => {
            await statusDisplayController.Update()
            embed.setDescription(`${Utils.GetEmoji("yes")} Status display updated! (took ${inlineCode(`${Math.round(Date.now() - cmd.timestamp)}ms`)})`)
                .setColor(Colors.Green)
                .setTimestamp()

            await msg.edit({ embeds: [embed] })
        })
    }
}

module.exports = CommandConstructor