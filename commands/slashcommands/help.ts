import { bold, Colors, EmbedBuilder, EmbedField, inlineCode, Interaction, SlashCommandBuilder, underline } from 'discord.js';
import Embed from '../../modules/Embed';
import { command as _command, utils } from '../../index';
import config from "../../config";
import Database from '../../modules/Database/Database';

const command = {
    name: ["help"],
    commandId: "help_slash",
    slash_command: true,

    data: new SlashCommandBuilder()
        .setName('help')
        .setDMPermission(true)
        .setDescription("Returns a list of all commands and other useful informations for the bot.")
        .addStringOption(option => option.setName("command")
            .setDescription("Select a command to view its details.")
            .setRequired(false)
            .addChoices(
                ...Array.from(_command.commands.values())
                    .filter(command => !command.hidden)
                    .map(command => ({
                        name: command.name[0],
                        value: command.name[0]
                    }))
            )),

    async callback(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        let embed: EmbedBuilder,
            option = interaction.options.get("command")

        if (option) {
            const _cmd = _command.commands.get(option.value.toString())
            let required_perms = ""
            if (_cmd.permissions) {
                _cmd.permissions.forEach(perm => {
                    required_perms += `-# ${utils.GetPermissionsName(perm).toUpperCase()}`
                })
            }
            embed = Embed({
                title: "Lua Obfuscator Bot - Help",
                description: `-# ${_cmd.description}`,
                fields: [{
                    name: "Syntax Usage:",
                    value: `-# ${bold(inlineCode(config.prefix + _cmd.name[0]))} ${_cmd.syntax_usage ? bold(inlineCode(_cmd.syntax_usage)) : ""}`,
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
            _command.commands.forEach(command => {
                if (command.hidden) return
                if (!commands_field.find(c => c.name == command.category)) commands_field.push({ name: command.category, value: "", inline: false })
                const index = commands_field.findIndex(c => c.name == command.category)
                commands_field[index].value += `${bold(typeof (command.name) == "object" && command.name[0] || typeof (command.name) == "string" && command.name)}, `
            });
            commands_field.forEach(f => commands_field[commands_field.indexOf(f)].value = `-# ${f.value.replace(/,\s*$/, "")}`)
            commands_field.push({
                name: "Note:",
                value: `-# Use ${bold(underline(`/help`))} ${bold(underline("<command>"))} to get information about a specific command.`,
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

        Database.Increment("cmd_stats", "call_count", { command_name: "help" }).catch(console.error)
        await interaction.reply({ ephemeral: true, embeds: [embed] })
    },
};


export { command };
