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
        if (!client) return "error"
        const guild = client.guilds.cache.get(config.SERVER_ID)
        if (!guild) return "error_0x1"
        return guild.memberCount || "error_0x2"
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
    fetchJSON: async function (endpoint) { return await fetch(endpoint).then(res => res.json()).catch(err => console.error(err)) }
} 