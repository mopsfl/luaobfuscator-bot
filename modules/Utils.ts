import { AttachmentBuilder, BufferResolvable, Message } from "discord.js"
import * as self from "../index"

export default class Utils {
    constructor() { }

    hasWebhook = function (string: string) { return /.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/.test(string) }
    hasCodeblock = function (string: string) { return /^([`])[`]*\1$|^[`]/mg.test(string) }
    parseWebhooks = function (string: string) { return string.match(/.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/gm) }
    parseCodeblock = function (string: string) { return string.replace(/(^`\S*)|`+.*/mg, "").trim() }
    createSession = async function (script: string) {
        const response = await fetch(`${self.config.api_url}newscript`, { method: "POST", body: script })
        return response.json()
    }
    manualObfuscateScript = async function (session: string, config: Object, message?: Message) {
        const response = await fetch(`${self.config.api_url}obfuscate`, { method: "POST", body: JSON.stringify(config), headers: { sessionId: session, apiKey: process.env.API_KEY } }).catch(error => {
            throw error
        })
        return response.json()
    }
    obfuscateScript = async function (script: string, message?: Message) {
        const response = await fetch(`${self.config.api_url}one-click/hard`, { method: "POST", body: script, headers: { apiKey: process.env.API_KEY } }).catch(error => {
            throw error
        })
        return response.json()
    }
    createFileAttachment = function (content: Buffer | BufferResolvable, name?: string) {
        const attachment = new AttachmentBuilder(content, { name: name || "obfuscated.lua" })
        return attachment
    }
    readAllChunks = async function (stream: ReadableStream) {
        const reader = stream.getReader();
        const chunks = [];
        let done: boolean, value: any;
        while (!done) {
            ({ value, done } = await reader.read())
            if (done) return chunks
            chunks.push(value)
        }
        return chunks
    }
}