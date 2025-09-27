import { Colors, EmbedBuilder, EmbedField, bold, inlineCode, underline } from "discord.js";
import { commandHandler } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Embed";
import Utils from "../modules/Utils";

class CommandConstructor {
    name = ["help"]
    category = commandHandler.CommandCategories.Bot
    description = "Returns a list of all commands and other useful informations for the bot."
    syntax_usage = "<command>"

    callback = async (cmd: Command) => {
        if (!cmd.message.channel.isSendable()) return;

        let embed: EmbedBuilder,
            validcommand = false,
            fullcommand_name = ""

        commandHandler.commands?.forEach(command => {
            if (!validcommand) {
                validcommand = cmd.arguments[0]
                    && typeof (cmd.arguments[0]) === "string"
                    && command.name.includes(cmd.arguments[0].replace(/\!/, ""))

                if (cmd.isPublic === false && !config.allowed_guild_ids.includes(cmd.message.guildId)) validcommand = false
                fullcommand_name = command.name[0]
            }
        })
        if (validcommand && typeof (cmd.arguments[0]) === "string") {
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
                value: `-# Use ${bold(underline(`${config.prefix}help`))} ${bold(underline("<command>"))} to get information about a specific command.`,
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

        await cmd.message.channel.send({ embeds: [embed] })
    }
}

module.exports = CommandConstructor