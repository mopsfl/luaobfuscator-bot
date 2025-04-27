import { Colors, EmbedAuthorData, EmbedBuilder, EmbedField, EmbedFooterData, codeBlock } from "discord.js"
import { utils } from "../index"
import { randomUUID } from "crypto"

export default function (args: { title?: string, description?: string, color?: any, timestamp?: boolean, author?: EmbedAuthorData, thumbnail?: string, image?: string, footer?: EmbedFooterData, fields?: Array<EmbedField> }) {
    const embed = new EmbedBuilder()

    try {
        if (args.color) embed.setColor(args.color)
        if (args.title) embed.setTitle(args.title)
        if (args.description) embed.setDescription(args.description)
        if (args.author) embed.setAuthor(args.author)
        if (args.thumbnail) embed.setThumbnail(args.thumbnail)
        if (args.image) embed.setImage(args.image)
        if (args.footer) embed.setFooter(args.footer)
        if (args.fields) embed.setFields(args.fields)
        if (args.timestamp) embed.setTimestamp()
    } catch (error) {
        const errorId = randomUUID()
        embed.setDescription(`If you read this, something probably went wrong while creating this embed!\nIf this keeps occurring, please send the **Error ID** to an Administrator!\n\n**Error ID:** ${codeBlock(errorId)}`)
        embed.setColor(Colors.Red)
        utils.SaveErrorToLogs(errorId, error)
        console.error(error)
    }
    return embed
}