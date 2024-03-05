// todo: make it more cleaner xd

import { Message } from "discord.js";
import * as self from "../index";

const reference = [
    ["I", "me", "my", "own"],
    ["need", "must", "have", "should", "will", "want"],
    ["deobfuscator", "deobf", "de-obf", "de-obfuscator", "deobfuscating", "deobfsc", "deobfuscat", "unobfuscate", "un obfuscate"]
]

const LaughGifUrl = "https://tenor.com/view/haha-gif-6815166390687140758"

export default function (message: Message) {
    if (message.author.bot || message.channel.isDMBased()) return
    const msg = message.content.toLowerCase().replace(/\<@\d+\>/gm, "").trim(); // Trim whitespace
    let referenced = false,
        hasDeobfWord = false,
        hasDeobfTerm = false

    for (const keyword of reference[0]) {
        if ((msg.toLocaleLowerCase()).includes(keyword.toLocaleLowerCase())) {
            referenced = true;
            break;
        }
    }
    if (!referenced) return;
    for (const keyword of reference[1]) {
        if ((msg.toLocaleLowerCase()).includes(keyword.toLocaleLowerCase())) {
            hasDeobfWord = true;
            break;
        }
    }
    if (!hasDeobfWord) return;
    for (const keyword of reference[2]) {
        if ((msg.toLocaleLowerCase()).includes(keyword.toLocaleLowerCase())) {
            hasDeobfTerm = true;
            break;
        }
    }
    hasDeobfTerm && message.reply(LaughGifUrl);
    return hasDeobfTerm
}

