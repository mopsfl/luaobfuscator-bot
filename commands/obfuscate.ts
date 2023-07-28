import { bold } from "discord.js";
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import * as self from "../index"

class Command {
    name = ["obfuscate", "obf", "obfsc"]
    category = self.commandCategories.LuaObfuscator
    description = ""

    callback = async (cmd: cmdStructure) => {
        const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
        await cmd.message.reply(`no, use website: ${bold("https://luaobfuscator.com")} ${GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
        return true
    }
}

module.exports = Command