import { AttachmentBuilder, BufferResolvable, Colors, EmbedBuilder, EmbedField, Message, PermissionFlagsBits, codeBlock } from "discord.js"
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
    getPermissionsName = function (bit: bigint) {
        const _index = Object.values(PermissionFlagsBits).findIndex(n => n === bit)
        return Object.keys(PermissionFlagsBits)[_index]
    }
    createSession = async function (script: string) {
        const response = await fetch(`${self.config.api_url}newscript`, { method: "POST", body: script })
        return response.json()
    }
    manualObfuscateScript = async function (session: string, config: Object) {
        const response = await fetch(`${self.config.api_url}obfuscate`, { method: "POST", body: JSON.stringify(config), headers: { sessionId: session, apiKey: process.env.LUAOBF_APIKEY } }).catch(error => {
            throw error
        })
        return response.json()
    }
    obfuscateScript = async function (script: string, message?: Message): Promise<ObfuscationResult> {
        const response = await fetch(`${self.config.api_url}one-click/hard`, { method: "POST", body: script, headers: { apiKey: process.env.LUAOBF_APIKEY } }).catch(error => {
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

    async DeleteErrorMessageCallback(msg: Message, deleteMs: number) {
        if (!deleteMs) return;
        setTimeout(async () => {
            if (msg.deletable === true)
                await msg.delete();
        }, deleteMs);
    }

    async SendErrorMessage(type: "error" | "syntax" | "permission" | "ratelimit", cmd: cmdStructure, error: Error | string, title?: string, syntaxErrorFields?: Array<EmbedField>, deleteMs?: number) {
        const errorId = randomUUID()
        let errorText = error instanceof Error && error.message || typeof (error) == "string" && error || "unknown internal error"

        switch (type) {
            case "error": {
                const embed_field = [
                    { name: "Error:", value: codeBlock(errorText), inline: false },
                ]
                if (self.env == "dev") embed_field.push({ name: "Stack:", value: codeBlock(error instanceof Error && `${error.stack || "Unknown stack"}` || "Unknown stack"), inline: false })
                await cmd.message.reply({
                    embeds: [self.Embed({
                        title: `${GetEmoji("no")} ${title || error instanceof Error && `${error.name}` || "Unknown Internal Error"}`,
                        fields: embed_field,
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
                await cmd.message.reply({
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
                break;
            }
            case "permission": {
                await cmd.message.reply({
                    embeds: [self.Embed({
                        title: `${GetEmoji("no")} ${title || "Permissions Error"}`,
                        description: codeBlock(errorText),
                        timestamp: true,
                        color: Colors.Red,
                        footer: {
                            text: `error_id: ${errorId}`
                        }
                    })]
                })
                break;
            }
            case "ratelimit": {
                await cmd.message.reply({
                    embeds: [self.Embed({
                        title: `${GetEmoji("no")} Ratelimit`,
                        fields: [
                            { inline: false, name: "Message:", value: codeBlock("You are using commands too fast! Calm down...") }
                        ],
                        timestamp: true,
                        color: Colors.Red,
                        footer: {
                            text: `error_id: ${errorId}`
                        }
                    })]
                }).then((msg) => this.DeleteErrorMessageCallback(msg, deleteMs));
                break;
            }
        }

        const error_logs: Array<any> = await self.file_cache.getSync("error_logs")
        error_logs.push({
            errorId: errorId,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack, cause: error.cause } : error,
            time: cmd.timestamp,
            user: cmd.message.author.id,
            arguments: cmd.raw_arguments
        })
        self.file_cache.setSync("error_logs", error_logs)
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