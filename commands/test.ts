import { codeBlock, inlineCode, PermissionFlagsBits } from "discord.js";
import { Command, CommandNode } from "../modules/CommandHandler"
import { commandHandler, statusDisplayController } from "../index";
import Embed from "../modules/Misc/Embed";
import Chart from "../modules/StatusDisplay/Chart";
import ObfuscatorStats from "../modules/ObfuscatorStats";

class CommandConstructor implements CommandNode {
    name = ["test"]
    category = commandHandler.CommandCategories.Misc
    description = "Test Command"
    permissions = [PermissionFlagsBits.Administrator]

    callback = async (command: Command) => {
        if (!command.arguments[0]) return await command.message.reply("please provide a test command name as an argument!")
        switch (command.arguments[0]) {
            case "chart": {
                const embed = Embed({
                    title: "chart test",
                    image: Chart.Create(await ObfuscatorStats.Parse(50), 50).toString(),
                    timestamp: true
                })

                await command.message.reply({ embeds: [embed] })
                break;
            }
            case "cbembed": {
                const embed = Embed({
                    fields: [
                        { name: "val1", value: codeBlock("value1"), inline: true },
                        { name: "val2", value: codeBlock("value2"), inline: true },
                        { name: "val3", value: codeBlock("value3"), inline: true },
                    ]
                })
                await command.message.reply({ embeds: [embed] })
                break;
            }
            case "oalert": case "ol": case "outagealert": {
                if (command.arguments[1]) {
                    statusDisplayController.SendAlertMessage(await statusDisplayController.GetOutage(command.arguments[1]))
                } else statusDisplayController.SendAlertMessage(statusDisplayController.lastOutage)
                break;
            }
            default:
                await command.message.reply(`unknown test command name ${inlineCode(command.arguments[0])}`)
                break;
        }
    }
}

module.exports = CommandConstructor