import { Message, MessageType } from "discord.js";
import { client } from "..";

const nohello_words = [
    "hello", "hi", "yo", "ey", "hallo", "hiya",
    "hey", "hola", "howdy", "sup", "hey there",
    "greetings", "bonjour", "ciao", "aloha",
    "hiyah", "heya", "holla", "hihi", "hail",
    "whatsup", "hiyah", "hi-dee-ho", "hi-ya",
    "hi-ho", "helo", "wsp", "wsg"
]

const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g

export default function (message: Message) {
    if (message.author.bot || message.channel.isDMBased()) return
    let msg = message.content.replace(/\<@\d+\>/gm, "").replace(/^\s+/gm, "")
    //nohello_words.forEach(word => msg = msg.replace(new RegExp(`${word}`, "gm"), ""))
    const nohello =
        message.mentions.users.size >= 1 &&
        message.attachments.size <= 0 &&
        new RegExp(/\s/gm).test(msg) != true &&
        msg.length <= 4

    if (emojiRegex.test(msg)) return;
    if (message.mentions.members.get(client.user.id.toString()) && message.type !== MessageType.Reply) return message.reply(`stop pinging me dumbass :clown:`)
    if (nohello && message.mentions.repliedUser == null) return message.reply(`https://nohello.net`)
    if (nohello_words.includes(msg.toLowerCase())) {
        message.channel.awaitMessages({ filter: (m) => m.author.id === message.author.id, time: 10000 }).then(msg => {
            if (msg.size <= 0) {
                message.reply(`https://nohello.net`)
            }
        })
    }

    return nohello
}