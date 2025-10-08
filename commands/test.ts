import { codeBlock, Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import { Command, CommandNode } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import { client, commandHandler } from "../index";
import config from "../config";
import Utils from "../modules/Utils";

class CommandConstructor implements CommandNode {
    name = ["test"]
    category = commandHandler.CommandCategories.Misc
    description = "Test Command"
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false

    callback = async (command: Command) => {
        command.message.reply({
            embeds: [Embed({
                color: Colors.Yellow,
                title: "Obfuscation Process",
                timestamp: true,
                footer: {
                    text: `Lua Obfuscator Bot - made by mopsfl`,
                    iconURL: config.icon_url,
                },
                fields: [
                    { name: "Script:", value: `-# ${Utils.FormatBytes(new TextEncoder().encode("a".repeat(Math.random() * 10000)).length)}`, inline: true },
                    { name: "Obfuscation Type:", value: `-# Default`, inline: true },
                    { name: "Process ID:", value: `-# 5dc76dfc`, inline: true },
                    { name: "Process State:", value: `-# FINISHED`, inline: true },
                    { name: "Process Time:", value: `-# 4714ms`, inline: true },
                    { name: "\u200B", value: "\u200B", inline: true },
                    { name: "Session:", value: `-# ${inlineCode("1R8cV6zW462h613D72NdDE5y9e1sDQ3kEd8vn9rrK5H3xrA008CT0iWWatOyD1k1")}`, inline: false },
                    { name: `Process:`, value: codeBlock("-"), inline: false },
                ]
            })]
        })
    }
}

module.exports = CommandConstructor