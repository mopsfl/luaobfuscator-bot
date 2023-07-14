const moment = require("moment")
const config = require("../.config")

require("moment-duration-format")

module.exports = {
    /**
     * @description Gets a emoji with the given name
     * @param {String} name
     */
    getEmoji: function (name) { if (!name || !global.client) return; return global.client.emojis.cache.find(emoji => emoji.name === name) },
    /**
     * @description Formats milliseconds to readable time
     * @param { Number } ms Milliseconds
     */
    formatUptime: function (ms = 0) { return moment.duration(ms).format(" D [days], H [hrs], m [mins], s [secs]") },
    /**
     * reads all chunks from a ReadableStream
     * @param { ReadableStream } readableStream 
     * @returns { [ Uint8Array, ...Uint8Array ] } chunks
     */
    readAllChunks: async function (readableStream) {
        const reader = readableStream.getReader();
        const chunks = [];
        let done, value;
        while (!done) {
            ({ value, done } = await reader.read())
            if (done) return chunks
            chunks.push(value)
        }
        return chunks
    },
    /**
     * @description Gets the member count of the server
     * @param { Client } client 
     */
    countMembers: async function (client) {
        if (!client) return "N/A"
        const guild = client.guilds.cache.get(config.SERVER_ID)
        if (!guild) return "N/A"
        return guild.memberCount || "N/A"
    },
    /**
     * @description Converts bytes to megabytes
     * @param { Number } bytes 
     */
    formatBytes: function (b, d = 2) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (!+b) return `0 ${sizes[0]}`
        const i = Math.floor(Math.log(b) / Math.log(1024))
        return `${(b / Math.pow(1024, i)).toFixed(d)} ${sizes[i]}`;
    },
    /**
     * @description Fetches json from an endpoint
     * @param { String } endpoint 
     */
    fetchJSON: async function (endpoint) { return await fetch(endpoint).then(res => res.json()).catch(err => console.error(err)) },
    /**
     * @description Formats a number to: 1K / 1M ...
     * @param { Number } num 
     * @param { Number } digits 
     * @returns 
     */
    formatNumber: function (num, digits = 0) {
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
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0" || "N/A";
    },
    /**
     * Fetches a resource and aborts when the request timed out
     * @param { String } resource 
     * @param { Object } options 
     * @returns 
     */
    _fetch: async function (resource, options = {}) {
        const { timeout = 8000 } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);

        return response;
    }
}