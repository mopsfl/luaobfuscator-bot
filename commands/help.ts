import { Colors, EmbedBuilder, EmbedField, PermissionFlagsBits, PermissionsBitField, bold, inlineCode, underline, underscore } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";

class Command {
    name = ["help"]
    category = CommandCategories.Bot
    description = "Returns a list of all commands and other useful informations for the bot."

    callback = async (cmd: cmdStructure) => {
        let embed: EmbedBuilder,
            validcommand = false,
            fullcommand_name = ""

        self.command.commands.forEach(_command => {
            if (!validcommand) {
                validcommand = cmd.arguments[0] && typeof (cmd.arguments[0]) === "string" && _command.name.includes(cmd.arguments[0].replace(/\!/, ""))
                if (cmd.public_command === false && !self.config.allowed_guild_ids.includes(cmd.message.guildId)) validcommand = false
                fullcommand_name = _command.name[0]
            }
        })
        if (validcommand && typeof (cmd.arguments[0]) === "string") {
            const _command = self.command.commands.get(fullcommand_name.replace(/\!/, ""))
            let required_perms = ""
            if (_command.permissions) {
                _command.permissions.forEach(perm => {
                    required_perms += `-# ${self.utils.GetPermissionsName(perm).toUpperCase()}`
                })
            }
            embed = Embed({
                title: "Lua Obfuscator Bot - Help",
                description: `-# ${_command.description}`,
                fields: [{
                    name: "Syntax Usage:",
                    value: `-# ${bold(inlineCode(self.config.prefix + _command.name[0]))} ${_command.syntax_usage ? bold(inlineCode(_command.syntax_usage)) : ""}`,
                    inline: false,
                }, {
                    name: "Required Permissions:",
                    value: `${required_perms || "-# None"}`,
                    inline: false,
                },],
                timestamp: true,
                thumbnail: self.config.icon_url,
                color: Colors.Green,
                footer: {
                    text: `Lua Obfuscator Bot`,
                    iconURL: self.config.icon_url,
                }
            })
        } else {
            let commands_field: Array<EmbedField> = []
            self.command.commands.forEach(command => {
                if (!commands_field.find(c => c.name == command.category)) commands_field.push({ name: command.category, value: "", inline: false })
                const index = commands_field.findIndex(c => c.name == command.category)
                commands_field[index].value += `${bold(typeof (command.name) == "object" && command.name[0] || typeof (command.name) == "string" && command.name)}, `
            });
            commands_field.forEach(f => commands_field[commands_field.indexOf(f)].value = `-# ${f.value.replace(/,\s*$/, "")}`)
            commands_field.push({
                name: "Note:",
                value: `-# Use ${bold(underline(`${self.config.prefix}help`))} ${bold(underline("<command>"))} to get more specific information about the command.`,
                inline: false
            })

            embed = Embed({
                title: "Lua Obfuscator Bot - Help",
                fields: commands_field,
                timestamp: true,
                thumbnail: self.config.icon_url,
                color: Colors.Green,
                footer: {
                    text: `Lua Obfuscator Bot`,
                    iconURL: self.config.icon_url,
                }
            })
        }

        await cmd.message.channel.send({ embeds: [embed] })
        return true
    }
}

module.exports = Command