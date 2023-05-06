const moment = require("moment")

require("moment-duration-format")

module.exports = {
    /**
     * @description Gets a emoji with the given name
     * @param {String} name
     */
    getEmoji: function (name) {
        if (!name || !global.client) return
        let emoji = global.client.emojis.cache.find(emoji => emoji.name === name)

        return emoji
    },
    /**
     * Formats milliseconds to readable time
     * @param { Number } ms Milliseconds
     */
    formatUptime: function (ms = 0) { return moment.duration(ms).format(" D [days], H [hrs], m [mins], s [secs]") }
}