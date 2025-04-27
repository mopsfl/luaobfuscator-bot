import { AttachmentBuilder, BufferResolvable, Colors, EmbedBuilder, EmbedField, Message, PermissionFlagsBits, codeBlock, inlineCode } from "discord.js"
import { config, utils, env, file_cache } from "../index"
import { cmdStructure } from "./Command"
import { randomUUID } from "crypto"
import GetEmoji from "./GetEmoji"
import Embed from "./Embed"
import { ObfuscationResult } from "./LuaObfuscator/Types"

export default class Utils {
    HasWebhook = function (string: string) { return /.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/.test(string) }
    HasCodeblock = function (string: string) { return /^([`])[`]*\1$|^[`]/mg.test(string) }
    ParseWebhooks = function (string: string) { return string.match(/.*\/(api\/(webhooks|webhook)|(webhooks|webhook))\/[0-9]+\/.*/gm) }
    ParseCodeblock = function (string: string) { return string.replace(/(^`\S*)|`+.*/mg, "").trim() }
    GetFullDate = function () { const date = new Date(); return date.toLocaleDateString("en", { month: "2-digit", day: "numeric", year: "numeric" }) }
    GetPermissionsName = function (bit: bigint) { return Object.keys(PermissionFlagsBits)[Object.values(PermissionFlagsBits).findIndex(n => n === bit)] }
    ToBase64(str: string) { return Buffer.from(str).toString("base64") }
    CreateFileAttachment = function (content: Buffer | BufferResolvable, name?: string) { return new AttachmentBuilder(content, { name: name || "obfuscated.lua" }) }

    async ParseScriptFromMessage(cmd: cmdStructure): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (utils.HasCodeblock(cmd.raw_arguments)) {
                return resolve(utils.ParseCodeblock(cmd.raw_arguments))
            } else if ([...cmd.message.attachments].length > 0) {
                const attachment = cmd.message.attachments.first(),
                    attachmentURL = attachment?.url

                if (!attachmentURL) return utils.SendErrorMessage("error", cmd, "Unable to get attachment URL.")
                await fetch(attachmentURL).then(async res => { resolve(await res.text()) }).catch(error => {
                    utils.SendErrorMessage("error", cmd, error)
                    reject(error)
                })
            } else {
                utils.SendErrorMessage("syntax", cmd, "Please provide a valid Lua script as a codeblock or a file.", null, [
                    { name: "Syntax:", value: inlineCode(`${cmd.slash_command ? "/" : config.prefix}${cmd.used_command_name} <codeblock> | <file>`), inline: false },
                    { name: "Reminder:", value: `If you need help, you may ask in <#1128990603087200276> for assistance.`, inline: false }
                ])

                return reject("invalid script input")
            }
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
        const error_logs: Array<any> = await file_cache.getSync("error_logs")
        error_logs.push({
            errorId: errorId,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack, cause: error.cause } : error,
            time: cmd?.timestamp || new Date().getTime(),
            user: cmd?.message?.author.id || inlineCode("N/A"),
            arguments: cmd?.raw_arguments || "N/A"
        })
        file_cache.setSync("error_logs", error_logs)
    }

    async SendErrorMessage(type: "error" | "syntax" | "permission" | "ratelimit", cmd: cmdStructure, error: Error | string, title?: string, syntaxErrorFields?: Array<EmbedField>, deleteMs?: number) {
        const errorId = randomUUID()
        let errorText = error instanceof Error && error.message || typeof (error) == "string" && error || "unknown internal error"

        switch (type) {
            case "error": {
                const embed_field = [
                    { name: "Error:", value: codeBlock(errorText), inline: false },
                ]
                if (env == "dev") embed_field.push({ name: "Stack:", value: codeBlock(error instanceof Error && `${error.stack || "Unknown stack"}` || "Unknown stack"), inline: false })
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

    ObjectKeysToString(obj: Object, toArray = false, hideFalseValues = true): any {
        let keys = [];

        function traverse(current: Object) {
            for (let key in current) {
                if (current.hasOwnProperty(key)) {
                    const value = current[key];

                    if (hideFalseValues && !value) continue;
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        traverse(value);
                    } else keys.push(key);
                }
            }
        }

        traverse(obj);
        return !toArray ? keys.join(', ') : keys;
    }

    ObjectToFormattedString(obj: Object, indent = 0, hideFalseValues = false) {
        if (Object.keys(obj).length === 0) return "{}";
        const indentation = "    ".repeat(indent);
        let str = "{\n";

        for (const [key, value] of Object.entries(obj)) {
            if (value === false && hideFalseValues) continue
            str += indentation + "    " + key + ": ";
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                str += this.ObjectToFormattedString(value, indent + 1);
            } else {
                str += JSON.stringify(value);
            }
            str += "\n";
        }

        str += indentation + "}";
        return str;
    }

    async Sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

export interface ObfuscationProcess {
    embed?: EmbedBuilder,
    error?: Error | string,
    processes: Array<string>,
    results: ObfuscationResult,
}