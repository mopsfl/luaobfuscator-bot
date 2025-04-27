import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Database from "../modules/Database";

class Command {
    name = ["deobfuscate", "deobf"]
    category = CommandCategories.LuaObfuscator
    description = "Deobfuscates a obfuscated script!! real!i!!i!"
    syntax_usage = "<file | codeblock>"

    callback = async (cmd: cmdStructure) => {
        await cmd.message.reply("Sorry, this ain't Luraph! :man_shrugging:")
        await Database.Increment("bot_statistics", "deobf_tries")

        return true
    }
}

module.exports = Command