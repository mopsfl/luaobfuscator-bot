import { Colors, EmbedField, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";

class Command {
    name = ["help"]
    category = self.commandCategories.Bot
    description = "Returns a list of all commands and other useful informations for the bot."

    callback = async (cmd: cmdStructure) => {
        let commands_field: Array<EmbedField> = []
        self.command.commands.forEach(command => {
            if (!commands_field.find(c => c.name == command.category)) commands_field.push({ name: command.category, value: "", inline: false })
            const index = commands_field.findIndex(c => c.name == command.category)
            commands_field[index].value += `${inlineCode(typeof (command.name) == "object" && command.name[0] || typeof (command.name) == "string" && command.name)}, `
        }); commands_field.forEach(f => commands_field[commands_field.indexOf(f)].value = f.value.replace(/,\s*$/, ""))

        const embed = self.Embed({
            title: "Lua Obfuscator Bot - Help",
            fields: commands_field,
            timestamp: true,
            thumbnail: self.config.icon_url,
            color: Colors.Green,
            footer: {
                text: "Lua Obfuscator Bot",
                iconURL: self.config.icon_url,
            }
        })
        await cmd.message.channel.send({ embeds: [embed] })
        return true
    }
}

module.exports = Command