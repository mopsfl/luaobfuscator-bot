import { EmbedAuthorData, EmbedBuilder, EmbedField, EmbedFooterData } from "discord.js"

export default function (args: { title?: string, description?: string, color?: any, timestamp?: boolean, author?: EmbedAuthorData, thumbnail?: string, image?: string, footer?: EmbedFooterData, fields?: Array<EmbedField> }) {
    const embed = new EmbedBuilder()

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