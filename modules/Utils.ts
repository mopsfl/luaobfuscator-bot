import { AttachmentBuilder, BufferResolvable, Message, PermissionFlagsBits } from "discord.js"
import { client } from "../index"

export default {
    HasCodeblock: function (string: string) { return /^([`])[`]*\1$|^[`]/mg.test(string) },
    GetPermissionsName: function (bit: bigint) { return Object.keys(PermissionFlagsBits)[Object.values(PermissionFlagsBits).findIndex(n => n === bit)] },
    CreateFileAttachment: function (content: Buffer | BufferResolvable, name?: string) { return new AttachmentBuilder(content, { name: name || "obfuscated.lua" }) },
    ParseCodeblock(input: string): string {
        const match = input.match(/```(?:\w+)?\n?([\s\S]*?)```/);
        return match ? match[1].trim() : "";
    },

    async ParseScriptFromMessage2(message: Message): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (this.HasCodeblock(message.content)) return resolve(this.ParseCodeblock(message.content))
            if ([...message.attachments].length > 0) {
                const attachment = message.attachments.first()
                if (!attachment || !attachment.url) return reject("Unable to parse attachment file!")

                await fetch(attachment.url).then(async res => { resolve(await res.text()) }).catch(reject)
            }

            reject("Please provide a valid Lua script as a codeblock or a file.")
        })
    },

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
    },

    ObjectToFormattedString(obj: Object, indent = 0, hideFalseValues = false) {
        const entries = Object.entries(obj).filter(([_, v]) => !(v === false && hideFalseValues))
        if (entries.length === 0) return "{}"

        const indentation = "    ".repeat(indent)
        let str = "{\n"

        entries.forEach(([key, value], index) => {
            str += indentation + "    " + key + ": "
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                str += this.ObjectToFormattedString(value, indent + 1, hideFalseValues)
            } else {
                str += JSON.stringify(value)
            }

            if (index < entries.length - 1) str += ","
            str += "\n"
        });

        str += indentation + "}"
        return str;
    },

    async Sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },

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
        ]
        var item = lookup.slice().reverse().find(function (item) {
            return num >= item.value;
        })
        return (item ? (num / item.value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + item.symbol : "0") || "N/A";
    },

    FormatUptime(ms: number, relative = false): string {
        if (!relative) {
            const s = Math.floor(ms / 1000)
            return [
                Math.floor(s / 86400) && `${Math.floor(s / 86400)} day${s / 86400 >= 2 ? "s" : ""}`,
                Math.floor((s % 86400) / 3600) && `${Math.floor((s % 86400) / 3600)} hr${(s % 86400) / 3600 >= 2 ? "s" : ""}`,
                Math.floor((s % 3600) / 60) && `${Math.floor((s % 3600) / 60)} min${(s % 3600) / 60 >= 2 ? "s" : ""}`,
                `${s % 60} sec${s % 60 !== 1 ? "s" : ""}`
            ].filter(Boolean).join(", ")
        }

        const units = [
            ["year", 31536000000],
            ["month", 2592000000],
            ["week", 604800000],
            ["day", 86400000],
            ["hour", 3600000],
            ["minute", 60000],
            ["second", 1000],
        ] as const

        const r = units.reduce((a, [l, v]) => {
            if (a.length < 2 && ms >= v) {
                const c = Math.floor(ms / v)
                a.push(`${c} ${l}${c > 1 ? "s" : ""}`)
                ms -= c * v
            }
            return a
        }, [] as string[])

        return r.length ? r.join(" ") : "0 seconds"
    },

    FormatBytes(b: number, d: number = 2) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (!+b) return `0 ${sizes[0]}`
        const i = Math.floor(Math.log(b) / Math.log(1024))
        return `${(b / Math.pow(1024, i)).toFixed(d)} ${sizes[i]}`;
    },

    GetEmoji(name: "loading" | "yes" | "no" | string) {
        return client?.emojis.cache.find(emoji => emoji.name === name)
    },

    ToLocalizedDateString(date: Date, includeYear = false) {
        return date.toLocaleDateString("en", {
            month: "2-digit",
            day: "2-digit",
            year: includeYear ? "numeric" : undefined
        }).replace(/\.$/, '')
    },

    GetLocalizedDateStrings(length = 7, includeYear = false): string[] {
        return Array.from({ length }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString("en", {
                month: "2-digit",
                day: "2-digit",
                year: includeYear ? "numeric" : undefined
            }).replace(/\.$/, '');
        }).reverse();
    },

    ToAnsiColor(text: string, color: AnsiColors = "white", style = 2) {
        const colors = {
            black: 30, red: 31, green: 32, yellow: 33,
            blue: 34, magenta: 35, cyan: 36, white: 37,
        }

        return `[${style};${colors[color.toLowerCase()] || 37}m${text}[0m`
    },

    ToAnsiCodeBlock(content: string) {
        return `\`\`\`ansi\n${content}\`\`\``
    }
}

export type AnsiColors = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white"