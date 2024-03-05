import { Message } from "discord.js";
import * as self from "../index";

const deobf_words = [
    "need", "must", "have", "script", "please", "how", "pleaes", "pls", "?", "can"
]

const LaughGifUrl = "https://tenor.com/view/haha-gif-6815166390687140758"

export default function (message: Message) {
    if (message.author.bot || message.channel.isDMBased()) return
    let msg = message.content.replace(/\<@\d+\>/gm, "").replace(/^\s+/gm, ""),
        hasDeobfWord = false

    for (let i = 0; i < deobf_words.length; i++) {
        if (msg.includes(deobf_words[i])) {
            hasDeobfWord = true;
            break;
        }
    }

    let deobfLaugh = msg.includes("deobf") && hasDeobfWord;
    deobfLaugh && message.reply(LaughGifUrl);
    return deobfLaugh;
}

