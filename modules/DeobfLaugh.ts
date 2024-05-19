// todo: make it more cleaner xd

import { Message, PermissionFlagsBits } from "discord.js";
import * as self from "../index";

const reference = [
    ["i", "me", "my", "own", "can"],
    ["need", "must", "have", "should", "will", "want", "someone", "you"],
    ["deobfuscator", "deobf", "de-obf", "de-obfuscator", "deobfuscating", "deobfsc", "deobfuscat", "unobfuscate", "decompile", "decrypt", "unencrypt"]
], ignored_roles = [
    "1112411674826248274",
    "1127902057257500785"
]

const LaughGifUrl = "https://tenor.com/view/haha-gif-6815166390687140758"

export default function (message: Message) {
    if (message.author.bot || message.channel.isDMBased()) return;
    if (message.member.roles.cache.find(role => ignored_roles.includes(role.id)) || message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const msg = message.content.toLowerCase().replace(/\<@\d+\>/gm, "").trim();

    const ref1 = reference[0].some(keyword => msg.includes(keyword));
    const ref2 = reference[1].some(keyword => msg.includes(keyword));
    const ref3 = reference[2].some(keyword => msg.includes(keyword));

    if (ref1 && ref2 && ref3) {
        message.reply(LaughGifUrl);
    }

    return true
}
