import * as self from "../index";

export default function (name: DefaultEmojiNames) {
    if (!self.client) return self.Debug({ message: "Unable to get emoji.", error: "App not successfully initialized." }, true)
    return self.client.emojis.cache.find(emoji => emoji.name === name)
}

export type DefaultEmojiNames = "loading" | "yes" | "no" | string