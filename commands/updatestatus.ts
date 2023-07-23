import * as self from "../index"
import { Colors, Message, PermissionsBitField, inlineCode } from "discord.js"
import GetEmoji from "../modules/GetEmoji"

export default function (message: Message) {
    return {
        enabled: true,
        command: "updatestatus",
        aliases: ["us", "updates", "upstat", "upstats"],
        required_permissions: [PermissionsBitField.Flags.Administrator],

        arguments: "",

        allow_dm: true,
        ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

        callback: async () => {
            if (!self.client || !message) return

            const start_tick = new Date().getTime()
            const commandId = self.command.createCommandId()

            try {
                message.reply({
                    embeds: [self.Embed({
                        description: "Updating status display... Please wait!",
                        color: Colors.Yellow,
                    })]
                }).then(async (msg) => {
                    await self.statusDisplay.UpdateDisplayStatus()
                    console.log(`> forced status display update by ${message.author.username}`)
                    await msg.edit({
                        embeds: [self.Embed({
                            description: `${GetEmoji("yes")} Status display updated! (took ${inlineCode(`${Math.round(new Date().getTime() - start_tick)}ms`)})`,
                            color: Colors.Green,
                            timestamp: true,
                            footer: {
                                text: `request id: ${commandId}`
                            }
                        })]
                    })
                }).catch(async err => await self.Debug(err, true))
                await self.Debug(`> command requested. id: ${commandId}`)
            } catch (err) { self.Debug(err, true) }
        }
    }
}