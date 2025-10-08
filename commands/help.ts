import { Colors, EmbedBuilder, EmbedField, bold, inlineCode, underline } from "discord.js";
import { commandHandler } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import Utils from "../modules/Utils";

class CommandConstructor {
    name = ["help"]
    category = commandHandler.CommandCategories.Bot
    description = "Shows a list of all commands and information about them."
    syntax_usage = "<command>"

    callback = async (command: Command) => {
        let embed: EmbedBuilder,
            validcommand = false,
            fullcommand_name = ""

        commandHandler.commands?.forEach(cmd => {
            if (!validcommand) {
                validcommand = command.arguments[0]
                    && typeof (command.arguments[0]) === "string"
                    && cmd.name.includes(command.arguments[0].replace(/\!/, ""))

                if (command.isPublic === false && !config.allowed_guild_ids.includes(command.message.guildId)) validcommand = false
                fullcommand_name = cmd.name[0]
            }
        })
        if (validcommand && typeof (command.arguments[0]) === "string") {
            const command = commandHandler.commands.get(fullcommand_name.replace(/\!/, ""))
            let required_perms = ""
            if (command.permissions) {
                command.permissions.forEach(perm => {
                    required_perms += `-# ${Utils.GetPermissionsName(perm).toUpperCase()}`
                })
            }
            embed = Embed({
                title: "Lua Obfuscator Bot - Help",
                description: `-# ${command.description}`,
                fields: [{
                    name: "Syntax Usage:",
                    value: `-# ${bold(inlineCode(config.prefix + command.name[0]))} ${command.syntax_usage ? bold(inlineCode(command.syntax_usage)) : ""}`,
                    inline: false,
                }, {
                    name: "Required Permissions:",
                    value: `${required_perms || "-# None"}`,
                    inline: false,
                },],
                timestamp: true,
                thumbnail: config.icon_url,
                color: Colors.Green,
                footer: {
                    text: `Lua Obfuscator`,
                    iconURL: config.icon_url,
                }
            })
        } else {
            let commands_field: Array<EmbedField> = []
            commandHandler.commands.forEach(command => {
                if (command.hidden) return
                if (!commands_field.find(c => c.name == command.category)) commands_field.push({ name: command.category, value: "", inline: false })
                const index = commands_field.findIndex(c => c.name == command.category)
                commands_field[index].value += `${bold(typeof (command.name) == "object" && command.name[0] || typeof (command.name) == "string" && command.name)}, `
            });
            commands_field.forEach(f => commands_field[commands_field.indexOf(f)].value = `-# ${f.value.replace(/,\s*$/, "")}`)
            commands_field.push({
                name: "Note:",
                value: `-# Use ${bold(inlineCode(`${config.prefix}help`))} ${bold(inlineCode("<command>"))} to get information about a specific command.`,
                inline: false
            })

            embed = Embed({
                title: "Lua Obfuscator Bot - Help",
                fields: commands_field,
                description: `-# ${bold("Prefix")}: ${inlineCode(config.prefix)}`,
                timestamp: true,
                thumbnail: config.icon_url,
                color: Colors.Green,
                footer: {
                    text: `Lua Obfuscator Bot`,
                    iconURL: config.icon_url,
                }
            })
        }

        await command.message.reply({ embeds: [embed] })
    }
}

module.exports = CommandConstructor