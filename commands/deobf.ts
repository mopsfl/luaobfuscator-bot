import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import { BotStats } from "./botstats";

class Command {
    name = ["deobf", "deobfuscate"]
    category = self.commandCategories.LuaObfuscator
    description = "Deobfuscates a obfuscated script!! real!i!!i!"
    syntax_usage = "<file | codeblock>"

    callback = async (cmd: cmdStructure) => {
        await cmd.message.reply("Sorry, this ain't Luraph! :man_shrugging:")
        const bot_stats: BotStats = await self.file_cache.get("bot_stats")
        if (bot_stats) {
            if (!bot_stats.total_monkey_deobfuscations) bot_stats.total_monkey_deobfuscations = 0
            bot_stats.total_monkey_deobfuscations++;
            await self.file_cache.set("bot_stats", bot_stats)
        }
        return true
    }
}

module.exports = Command