import { Message } from "discord.js";

const nohello_words = [
    "hello", "hi", "yo", "ey", "hallo", "hiya",
    "hey", "hola", "howdy", "sup", "hey there",
    "greetings", "bonjour", "ciao", "aloha",
    "hiyah", "heya", "holla", "hihi", "hail",
    "whatsup", "hiyah", "hi-dee-ho", "hi-ya",
    "hi-ho"
]

export default function (message: Message) {
    if (message.author.bot || message.channel.isDMBased()) return
    let msg = message.content.replace(/\<@\d+\>/gm, "").replace(/^\s+/gm, "")
    nohello_words.forEach(word => msg = msg.replace(new RegExp(`${word}`, "gm"), ""))
    const nohello =
        message.mentions.users.size >= 1 &&
        message.attachments.size <= 0 &&
        new RegExp(/\s/gm).test(msg) != true &&
        msg.length <= 4

    if (nohello && message.mentions.repliedUser == null) message.reply(`https://nohello.net`)
    return nohello
}