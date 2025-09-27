import { commandHandler } from "..";
import { Command } from "../modules/CommandHandler"
import Database from "../modules/Database/Database";

class CommandConstructor {
    name = ["deobfuscate", "deobf"]
    category = commandHandler.CommandCategories.LuaObfuscator
    description = "Deobfuscates a obfuscated script!! real!i!!i!"
    syntax_usage = "<file | codeblock>"

    callback = async (cmd: Command) => {
        cmd.message.reply("Sorry, this ain't Luraph! :man_shrugging:")
        Database.Increment("bot_statistics", "deobf_tries")
    }
}

module.exports = CommandConstructor