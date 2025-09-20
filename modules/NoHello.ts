import { Message, MessageType } from "discord.js";
import { client } from "..";
import Database from "./Database/Database";

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
    try {
        if (message.author.bot || message.channel.isDMBased()) return
        let msg = message.content.replace(/\<@\d+\>/gm, "").replace(/^\s+/gm, "")

        const nohello = message.mentions.users.size >= 1 &&
            message.attachments.size <= 0 &&
            new RegExp(/\s/gm).test(msg) != true &&
            msg.length <= 4

        if (emojiRegex.test(msg)) return;
        if (message.mentions.members.get(client.user.id.toString()) && message.type !== MessageType.Reply) {
            Database.Increment("nohello_stats", "noping_count").catch(console.error)
            return message.reply(`stop pinging me dumbass :clown:`).catch(console.error)
        }

        if (nohello && message.mentions.repliedUser == null) {
            Database.Increment("nohello_stats", "nohello_count").catch(console.error)
            return message.reply(`https://nohello.net`).catch(console.error)
        }

        if (nohello_words.includes(msg.toLowerCase())) {
            message.channel.awaitMessages({ filter: (m) => m.author.id === message.author.id, time: 10000 }).then(msg => {
                if (msg.size <= 0) {
                    Database.Increment("nohello_stats", "nohello_count").catch(console.error)
                    message.reply(`https://nohello.net`).catch(console.error)
                }
            }).catch(console.error)
        }

        return nohello
    } catch (error) {
        console.error(`[NO HELLO ERROR]: ${error}`)
    }
}