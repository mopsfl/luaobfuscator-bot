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
    nohello_words.forEach(word => message.content = message.content.replace(new RegExp(`${word}|\\s+`, "gm"), ""))
    const nohello = message.mentions.users.size == 1 && message.content.replace(/\<@\d+\>/gm, "").length <= 0
    if (nohello) message.reply(`https://nohello.net`)
    return nohello
}