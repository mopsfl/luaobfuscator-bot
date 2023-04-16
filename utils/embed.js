const {
    Colors,
    EmbedBuilder,
} = require("discord.js")

module.exports = {
    /**
     * @description Creates a embed object
     */
    createEmbed: function(args = { title, description, color: Colors, timestamp: false, author: { name: String, iconURL: String, url: String }, thumbnail: String, image: String, footer: { text: String, iconURL: String }, fields: { name: String, value: String } }) {
        let embed = new EmbedBuilder()

        if (args.color) embed.setColor(args.color)
        if (args.title) embed.setTitle(args.title)
        if (args.description) embed.setDescription(args.description)
        if (args.author) embed.setAuthor(args.author)
        if (args.thumbnail) embed.setThumbnail(args.thumbnail)
        if (args.image) embed.setImage(args.image)
        if (args.footer) embed.setFooter(args.footer)
        if (args.fields) embed.setFields(args.fields)
        if (args.timestamp) embed.setTimestamp()

        return embed
    }
}