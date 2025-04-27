import { bold, ComponentType } from "discord.js";
import { config, utils } from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import CommandCategories from "../modules/CommandCategories";
import { CustomObfuscateController } from "../modules/CustomObfuscate/Controller";

class Command {
    name = ["customobfuscate", "co", "cobf"]
    category = CommandCategories.LuaObfuscator
    description = "Obfuscates your given input using the REST API with your selected plugins."
    syntax_usage = "<file | codeblock>"

    callback = async (cmd: cmdStructure) => {
        if (!cmd.message.channel.isDMBased()) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            await cmd.message.reply(`no, use website: ${bold(config.STATUS_DISPLAY.endpoints.homepage)} or slide in my dms ${GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
            return true
        }

        const Controller = new CustomObfuscateController(cmd.message.author)

        await utils.ParseScriptFromMessage(cmd).then(async script => {
            Controller.script_content = script
            Controller.response = await cmd.message.reply({ components: [Controller.components.rows.main], embeds: [Controller.components.embeds.main] })
            Controller.main_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 })
            Controller.plugins_collector = Controller.response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 120000 })

            Controller.main_collector.on("collect", Controller.OnButtonClick.bind(this))
            Controller.plugins_collector.on("collect", Controller.OnPluginSelect.bind(this))
        }).catch(err => {
            console.error(`unable to create custom obfuscation process for ${cmd.message.author.username}! (${err})`)
        })

        return true
    }
}

module.exports = Command
