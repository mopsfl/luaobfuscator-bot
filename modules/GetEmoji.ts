import { client } from "../index";

export default function (name: DefaultEmojiNames) {
    if (!client) return console.error("Unable to get emoji! App not successfully initialized.")
    return client.emojis.cache.find(emoji => emoji.name === name)
}

export type DefaultEmojiNames = "loading" | "yes" | "no" | string