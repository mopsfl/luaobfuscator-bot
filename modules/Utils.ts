import { AttachmentBuilder, BufferResolvable, Colors, EmbedBuilder, EmbedField, Message, PermissionFlagsBits, codeBlock, inlineCode } from "discord.js"
import { utils, env, client } from "../index"
import config from "../config";
import { cmdStructure } from "./Command"
import { randomUUID } from "crypto"
import Embed from "./Embed"
import { ObfuscationResult } from "./LuaObfuscator/Types"

export default class Utils {
    HasCodeblock = function (string: string) { return /^([`])[`]*\1$|^[`]/mg.test(string) }
    ParseCodeblock = function (string: string) { return string.replace(/(^`\S*)|`+.*/mg, "").trim() }
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
                        title: `${this.GetEmoji("no")} ${title || error instanceof Error && `${error.name}` || "Unknown Internal Error"}`,
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
                        title: `${this.GetEmoji("no")} ${title || "Syntax Error"}`,
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
                        title: `${this.GetEmoji("no")} ${title || "Permissions Error"}`,
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
                        title: `${this.GetEmoji("no")} Ratelimit`,
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

    FormatNumber(num: number, digits: number = 2) {
        if (typeof (num) != "number") return "N/A"
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var item = lookup.slice().reverse().find(function (item) {
            return num >= item.value;
        });
        return (item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0") || "N/A";
    }

    FormatUptime(ms: number, relative = false): string {
        if (!relative) {
            let totalSeconds = (ms / 1000);
            let days = Math.floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = Math.floor(totalSeconds % 60);

            const formatUnit = (value: number, singular: string, plural: string) => {
                return value > 0 ? `${value} ${value > 1 ? plural : singular}, ` : "";
            }

            return `${formatUnit(days, "day", "days")}${formatUnit(hours, "hr", "hrs")}${formatUnit(minutes, "min", "mins")}${seconds} ${seconds > 1 ? "secs" : "sec"}`;
        } else {
            const units = [
                { label: 'year', ms: 31536000000 },
                { label: 'month', ms: 2592000000 },
                { label: 'week', ms: 604800000 },
                { label: 'day', ms: 86400000 },
                { label: 'hour', ms: 3600000 },
                { label: 'minute', ms: 60000 },
                { label: 'second', ms: 1000 },
            ];

            let remaining = ms;
            const result: string[] = [];

            for (const unit of units) {
                const count = Math.floor(remaining / unit.ms);
                if (count > 0) {
                    result.push(`${count} ${unit.label}${count > 1 ? 's' : ''}`);
                    remaining -= count * unit.ms;
                }
                if (result.length === 2) break;
            }

            if (result.length === 0) return '0 seconds';
            return result.join(' ');
        }
    }

    FormatBytes(b: number, d: number = 2) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (!+b) return `0 ${sizes[0]}`
        const i = Math.floor(Math.log(b) / Math.log(1024))
        return `${(b / Math.pow(1024, i)).toFixed(d)} ${sizes[i]}`;
    }

    GetEmoji(name: "loading" | "yes" | "no" | string) {
        if (!client) return console.error("Unable to get emoji! App not successfully initialized.")
        return client.emojis.cache.find(emoji => emoji.name === name)
    }

    DateToTimeStamp(date: string) {
        const [d, m, y] = date.split(".").map(n => parseInt(n, 10));
        return new Date(y, m - 1, d);
    };
}

export interface ObfuscationProcess {
    embed?: EmbedBuilder,
    error?: Error | string,
    processes: Array<string>,
    results: ObfuscationResult,
}