import { ChatInputCommandInteraction, codeBlock, EmbedBuilder, inlineCode, Message, MessageFlags } from "discord.js"
import Embed from "../Misc/Embed";
import Utils from "../Utils";
import ErrorEmbed from "./Embeds/Error";
import SyntaxEmbed from "./Embeds/Syntax";
import { ENV } from "../../index";

export default {
    async new(args: ErrorArgs) {
        const errorEmbed = this.CreateErrorEmbed(args)

        let responseMessage: Message = null

        try {
            if (args.message) responseMessage = await args.message.reply({ embeds: [errorEmbed] })
            if (args.interaction) responseMessage = await args.interaction.followUp({ embeds: [errorEmbed], flags: [MessageFlags.Ephemeral] })

            if (typeof args.ttl === "number" && responseMessage) {
                setTimeout(async () => {
                    await responseMessage.delete().catch(console.error);
                }, args.ttl);
            }
        } catch (error) {
            console.error(error)
        }
    },

    CreateErrorEmbed(args: ErrorArgs) {
        const errorMessage = args.error instanceof Error ? (ENV === "dev" ? args.error.stack : args.error.message) : args.error,
            errorName = args.error instanceof Error ? args.error.name : "Error"

        let embed: EmbedBuilder = null
        if (args.type === undefined || args.type === "default") {
            embed = Embed(ErrorEmbed()).setTitle(`${Utils.GetEmoji("no")} ${args.title || errorName}`)
            embed.data.fields[0].value = codeBlock(errorMessage.slice(0, 1000) || "unknown error")
        } else if (args.type === "syntax") {
            embed = Embed(SyntaxEmbed()).setDescription(codeBlock(errorMessage.slice(0, 1000)))
            embed.data.fields[0].value = `-# ${args.syntax ? inlineCode(args.syntax) : inlineCode("unknown command syntax :(")}`
        }

        return embed
    }
}

export type ErrorType = "default" | "syntax"
export type ErrorArgs =
    | { error: string | Error; title?: string, type?: ErrorType, syntax?: string, message: Message; interaction?: never, ttl?: number }
    | { error: string | Error; title?: string, type?: ErrorType, syntax?: string, message?: never; interaction: ChatInputCommandInteraction, ttl?: number };
