import { PermissionFlagsBits } from "discord.js";
import { Command, CommandNode } from "../modules/CommandHandler"
import { commandHandler } from "../index";
import Embed from "../modules/Misc/Embed";
import Chart from "../modules/StatusDisplay/Chart";
import ObfuscatorStats from "../modules/ObfuscatorStats";

class CommandConstructor implements CommandNode {
    name = ["test"]
    category = commandHandler.CommandCategories.Misc
    description = "Test Command"
    permissions = [PermissionFlagsBits.Administrator]

    callback = async (command: Command) => {
        const embed = Embed({
            title: "chart test",
            image: Chart.Create(await ObfuscatorStats.Parse(50), 50).toString(),
            timestamp: true
        })

        command.message.reply({
            embeds: [embed]
        })
    }
}

module.exports = CommandConstructor