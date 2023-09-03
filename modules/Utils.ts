import { AttachmentBuilder, BufferResolvable, Colors, EmbedBuilder, EmbedField, Message, codeBlock } from "discord.js"
import * as self from "../index"
import { cmdStructure } from "./Command"
import { randomUUID } from "crypto"
import GetEmoji from "./GetEmoji"

export default class Utils {
    constructor() { }

    hasWebhook = function (string: string) { return /.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/.test(string) }
    hasCodeblock = function (string: string) { return /^([`])[`]*\1$|^[`]/mg.test(string) }
    parseWebhooks = function (string: string) { return string.match(/.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/gm) }
    parseCodeblock = function (string: string) { return string.replace(/(^`\S*)|`+.*/mg, "").trim() }
    getFullDate = function () { const date = new Date(); return date.toLocaleDateString("en", { month: "2-digit", day: "numeric", year: "numeric" }) }
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
    obfuscateScript = async function (script: string, message?: Message): Promise<ObfuscationResult> {
        const response = await fetch(`${self.config.api_url}one-click/hard`, { method: "POST", body: script, headers: { apiKey: process.env.API_KEY } }).catch(error => {
            if (message) this.SendErrorMessage(error, message)
            throw error
        })
        if (response.ok) return await response.json()
        return { message: "Unexpected error occurred while obfuscating your script." }
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
    SendErrorMessage(type: "error" | "syntax", cmd: cmdStructure, error: Error | string, title?: string, syntaxErrorFields?: Array<EmbedField>) {
        const errorId = randomUUID()
        let errorText = error instanceof Error && error.message || typeof (error) == "string" && error || "unknown internal error"

        switch (type) {
            case "error": {
                cmd.message.reply({
                    embeds: [self.Embed({
                        title: `${GetEmoji("no")} ${title || error instanceof Error && `${error.name}` || "Unknown Internal Error"}`,
                        fields: [
                            { name: "Error:", value: codeBlock(errorText), inline: false },
                            self.env == "dev" && { name: "Stack:", value: codeBlock(error instanceof Error && `${error.stack || "Unknown stack"}` || "Unknown stack"), inline: false }
                        ],
                        timestamp: true,
                        color: Colors.Red,
                        footer: {
                            text: `errorId: ${errorId}`
                        }
                    })]
                })
                break;
            }
            case "syntax": {
                cmd.message.reply({
                    embeds: [self.Embed({
                        title: `${GetEmoji("no")} ${title || "Syntax Error"}`,
                        description: codeBlock(errorText),
                        fields: syntaxErrorFields,
                        timestamp: true,
                        color: Colors.Red,
                        footer: {
                            text: `error_id: ${errorId}`
                        }
                    })]
                })
            }
        }
    }
}

export interface ObfuscationProcess {
    embed?: EmbedBuilder,
    error?: Error | string,
    processes: Array<string>,
    results: ObfuscationResult,
}

export interface ObfuscationResult {
    message?: string,
    code?: string,
    sessionId?: string
}