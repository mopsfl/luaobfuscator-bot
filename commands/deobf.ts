import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";

class Command {
    name = ["deobf", "deobfuscate"]
    category = self.commandCategories.Bot
    description = "Deobfuscates a obfuscated script!!!! fr"

    callback = async (cmd: cmdStructure) => {
        await cmd.message.reply("Sorry, this ain't Luraph! :man_shrugging:")
        return true
    }
}

module.exports = Command