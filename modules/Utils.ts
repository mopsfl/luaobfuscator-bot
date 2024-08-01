import { AttachmentBuilder, BufferResolvable, Colors, EmbedBuilder, EmbedField, Message, PermissionFlagsBits, codeBlock, inlineCode } from "discord.js"
import * as self from "../index"
import { cmdStructure } from "./Command"
import { randomUUID } from "crypto"
import GetEmoji from "./GetEmoji"
import Embed from "./Embed"

export default class Utils {
    HasWebhook = function (string: string) { return /.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/.test(string) }
    HasCodeblock = function (string: string) { return /^([`])[`]*\1$|^[`]/mg.test(string) }
    ParseWebhooks = function (string: string) { return string.match(/.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/gm) }
    ParseCodeblock = function (string: string) { return string.replace(/(^`\S*)|`+.*/mg, "").trim() }
    GetFullDate = function () { const date = new Date(); return date.toLocaleDateString("en", { month: "2-digit", day: "numeric", year: "numeric" }) }
    GetPermissionsName = function (bit: bigint) { return Object.keys(PermissionFlagsBits)[Object.values(PermissionFlagsBits).findIndex(n => n === bit)] }
    ToBase64(str: string) { return Buffer.from(str).toString("base64") }
    CreateFileAttachment = function (content: Buffer | BufferResolvable, name?: string) { return new AttachmentBuilder(content, { name: name || "obfuscated.lua" }) }

    CreateSession = async function (script: string) {
        try {
            const response = await fetch(`${self.config.api_url}newscript`, { method: "POST", body: script, headers: { apiKey: process.env.LUAOBF_APIKEY } })
            return response.ok && response.json()
        } catch (error) {
            console.error(error)
        }
    }

    ManualObfuscateScript = async function (session: string, config: Object) {
        try {
            const response = await fetch(`${self.config.api_url}obfuscate`, { method: "POST", body: JSON.stringify(config), headers: { sessionId: session, apiKey: process.env.LUAOBF_APIKEY } }).catch(error => {
                throw error
            })
            return response.json()
        } catch (error) {
            console.error()
        }
    }

    ObfuscateScript = async function (script: string, message?: Message): Promise<ObfuscationResult> {
        const response = await fetch(`${self.config.api_url}one-click/hard`, { method: "POST", body: script, headers: { apiKey: process.env.LUAOBF_APIKEY } }).catch(error => {
            if (message) this.SendErrorMessage(error, message)
            throw error
        })
        return await response.json().catch(async err => {
            return { message: `Unexpected error occurred while obfuscating your script.\n\nRequest Status: ${response.statusText} - ${response.status}\n\nError: ${err}` }
        })
    }

    ReadAllChunks = async function (stream: ReadableStream) {
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

    async SaveErrorToLogs(errorId: string, error: Error | string, cmd?: cmdStructure) {
        const error_logs: Array<any> = await self.file_cache.getSync("error_logs")
        error_logs.push({
            errorId: errorId,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack, cause: error.cause } : error,
            time: cmd?.timestamp || new Date().getTime(),
            user: cmd?.message?.author.id || inlineCode("N/A"),
            arguments: cmd?.raw_arguments || "N/A"
        })
        self.file_cache.setSync("error_logs", error_logs)
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
                    embeds: [Embed({
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
                    embeds: [Embed({
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
                    embeds: [Embed({
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
                    embeds: [Embed({
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

        await this.SaveErrorToLogs(errorId, error, cmd)
    }

    NewPromise(timeout: number, callback: Function) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Request timed out after ${timeout}ms`));
            }, timeout);

            callback(
                (value: any) => { clearTimeout(timer); resolve(value) },
                (error: any) => { clearTimeout(timer); reject(error) }
            );
        });
    }

    ObjectKeysToString(obj: {}, ignoredValues = []) {
        let str = "";
        function traverse(_obj: {}) {
            Object.keys(_obj).forEach(key => {
                if (Array.isArray(_obj[key]) && !ignoredValues.includes(_obj[key])) {
                    str += `${key}, `;
                } else if (typeof _obj[key] === "object") {
                    traverse(_obj[key]);
                } else {
                    if (!ignoredValues.includes(_obj[key])) str += `${key}, `;
                }
            });
        }
        traverse(obj);
        return str.replace(/,\s$/g, "");
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