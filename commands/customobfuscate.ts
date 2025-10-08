import { bold, ComponentType } from "discord.js";
import { commandHandler } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import { CustomObfuscateController } from "../modules/CustomObfuscate/Controller";
import Utils from "../modules/Utils";
import ErrorHandler from "../modules/ErrorHandler/ErrorHandler";

class CommandConstructor {
    name = ["customobfuscate", "co", "cobf"]
    category = commandHandler.CommandCategories.LuaObfuscator
    description = "Obfuscates your script with custom configuration."
    syntax_usage = "<file | codeblock>"

    callback = async (command: Command) => {
        if (!command.message.channel.isDMBased()) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            await command.message.reply(`no, use website: ${bold(config.STATUS_DISPLAY.endpoints.homepage)} or slide in my dms ${Utils.GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
            return true
        }

        const Controller = new CustomObfuscateController(command.message.author)

        await Utils.ParseScriptFromMessage2(command.message).then(async script => {
            Controller.script_content = script
            Controller.response = await command.message.reply({ components: [Controller.components.rows.main], embeds: [Controller.components.embeds.main] })
            Controller.main_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180000 })
            Controller.plugins_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180000 })

            Controller.main_collector.on("collect", Controller.OnButtonClick.bind(this))
            Controller.plugins_collector.on("collect", Controller.OnPluginSelect.bind(this))
        }).catch(err => {
            return ErrorHandler.new({
                type: "syntax",
                message: command.message,
                error: err,
                syntax: `${config.prefix}${command.name} <codeblock> | <file>`
            })
        })
    }
}

module.exports = CommandConstructor
