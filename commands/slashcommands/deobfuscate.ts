import { Command, CommandNode } from "../../modules/CommandHandler"
import { commandHandler } from "../../index"
import { SlashCommandBuilder } from "discord.js"
import Database from "../../modules/Database/Database"

class CommandConstructor implements CommandNode {
    name = ["deobfuscate"]
    category = commandHandler.CommandCategories.LuaObfuscator
    description = "Deobfuscates a obfuscated script!! real!i!!i!"
    slash_command = true

    slashCommandBuilder = new SlashCommandBuilder()
        .setName(this.name[0])
        .setDescription(this.description)

    callback = async (command: Command) => {
        Database.Increment("bot_statistics", "deobf_tries").catch(console.error)
        await command.interaction.reply("Sorry, this ain't Luraph! :man_shrugging:")
    }
}

module.exports = CommandConstructor