module.exports = {
    /**
     * @description Gets a emoji with the given name
     * @param {String} name
     */
    getEmoji: function(name) {
        if (!name || !global.client) return
        let emoji = global.client.emojis.cache.find(emoji => emoji.name === name)

        return emoji
    }
}