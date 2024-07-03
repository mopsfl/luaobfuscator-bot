import { Colors, PermissionFlagsBits, codeBlock, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";

class Command {
    name = ["geterror", "gerr", "ge"]
    category = CommandCategories.Misc
    description = "Returns the information of the given error id."
    permissions = [PermissionFlagsBits.Administrator]
    syntax_usage = "<error_id>"
    public_command = false
    direct_message = false

    callback = async (cmd: cmdStructure) => {
        if (cmd.arguments.length < 1) return self.utils.SendErrorMessage("syntax", cmd, "Please provide the error id.", null, [
            { name: "Syntax:", value: inlineCode(`${self.config.prefix}${cmd.used_command_name} ${this.syntax_usage}`), inline: false },
        ])

        const error_logs: Array<any> = await self.file_cache.getSync("error_logs"),
            _error: any = error_logs.find(_err => _err.errorId === cmd.arguments[0])
        if (!_error) return self.utils.SendErrorMessage("error", cmd, "Given error id was not found.")

        const _fields = [
            { name: "Name:", value: codeBlock(_error.error.name || "N/A"), inline: false },
            { name: "Message:", value: codeBlock(typeof (_error.error) === "object" ? _error.error.message || "N/A" : _error.error || "N/A"), inline: false },
            { name: "Stack:", value: codeBlock(_error.error.stack || "N/A"), inline: false },
            { name: "Cause:", value: codeBlock(_error.error.cause || "N/A"), inline: false },
            { name: "Time:", value: `<t:${Math.round(parseInt(_error.time) / 1000)}:R> | ${inlineCode(_error.time)}`, inline: false },
            { name: "User:", value: _error.user ? `<@${_error.user}>` : codeBlock("N/A"), inline: false },
            { name: "Arguments:", value: codeBlock(_error.arguments || "N/A"), inline: false },
            { name: "Error ID:", value: codeBlock(_error.errorId || "N/A"), inline: false },
        ]

        try {
            cmd.message.reply({
                embeds: [Embed({
                    description: `${GetEmoji("loading")} Getting error information... Please wait...`,
                    color: Colors.Yellow,
                    footer: { text: cmd.arguments[0].toString() },
                    timestamp: true
                })]
            }).then(msg => {
                cmd.message.author.send({
                    embeds: [Embed({
                        title: `${GetEmoji("no")} Error Information`,
                        fields: _fields,
                        color: Colors.Yellow,
                        timestamp: true,
                        footer: { text: cmd.arguments[0].toString() },
                    })]
                }).catch(async err => {
                    msg.edit({
                        embeds: [Embed({
                            title: `${GetEmoji("no")} Reply Error`,
                            description: `${GetEmoji("no")} Please change your ${inlineCode("Privacy Setting")} so I can send you the results in your Direct Messages.`,
                            color: Colors.Red,
                            timestamp: true,
                            footer: { text: cmd.arguments[0].toString() }
                        })]
                    })
                    console.error(err)
                })
                msg.edit({
                    embeds: [Embed({
                        description: `${GetEmoji("yes")} I've sent you the error information via dms!`,
                        color: Colors.Green,
                        footer: { text: cmd.arguments[0].toString() },
                        timestamp: true
                    })]
                })
            })
        } catch (error) {
            console.error(error)
            self.utils.SendErrorMessage("error", cmd, error)
        }
    }
}

module.exports = Command