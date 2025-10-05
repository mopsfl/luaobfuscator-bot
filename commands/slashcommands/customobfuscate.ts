import { Command, CommandNode } from "../../modules/CommandHandler"
import { commandHandler } from "../../index"
import { ComponentType, MessageFlags, SlashCommandBuilder } from "discord.js"
import Utils from "../../modules/Utils"
import { CustomObfuscateController } from "../../modules/CustomObfuscate/Controller"
import ErrorHandler from "../../modules/ErrorHandler/ErrorHandler"
import config from "../../config"

class CommandConstructor implements CommandNode {
    name = ["customobfuscate"]
    category = commandHandler.CommandCategories.Bot
    description = "Obfuscates your given input using the REST API with your selected plugins."
    slash_command = true

    slashCommandBuilder = new SlashCommandBuilder()
        .setName(this.name[0])
        .setDescription(this.description)

    callback = async (command: Command) => {
        await command.interaction.reply({
            content: `Please upload a valid Lua script as a file, or paste it here inside a code block.`,
            flags: [MessageFlags.Ephemeral]
        }).then(interactionReply => {
            command.interaction.channel.awaitMessages({ filter: (m) => m.author.id === command.interaction.user.id, max: 1, time: 60_000, errors: ["time"] }).then(async msg => {
                interactionReply.delete()
                Utils.ParseScriptFromMessage2(msg.first()).then(async script => {
                    const Controller = new CustomObfuscateController(command.interaction.user)

                    Controller.script_content = script
                    Controller.response = await command.interaction.followUp({ components: [Controller.components.rows.main], embeds: [Controller.components.embeds.main] })
                    Controller.main_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180000 })
                    Controller.plugins_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180000 })

                    Controller.main_collector.on("collect", Controller.OnButtonClick.bind(this))
                    Controller.plugins_collector.on("collect", Controller.OnPluginSelect.bind(this))
                }).catch(err => {
                    return ErrorHandler.new({
                        type: "syntax",
                        interaction: command.interaction,
                        error: err,
                        syntax: `${config.prefix}${command.name} <codeblock> | <file>`
                    })
                })
            })
        })
    }
}

module.exports = CommandConstructor
