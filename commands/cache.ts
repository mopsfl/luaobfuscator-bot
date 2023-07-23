import * as self from "../index"
import { Colors, Message, PermissionsBitField, inlineCode } from "discord.js"
import GetEmoji from "../modules/GetEmoji"

export default function (message: Message) {
    return {
        enabled: true,
        command: "cache",
        aliases: [],
        required_permissions: [PermissionsBitField.Flags.Administrator],

        arguments: "",

        allow_dm: true,
        ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

        callback: async () => {
            if (!self.client || !message) return

            const start_tick = new Date().getTime()
            const commandId = self.command.createCommandId()

            try {
                const session_id = await self.session.Create(60)
                const finished_embed = self.Embed({
                    description: `${GetEmoji("yes")} Temporary cache link created. I've sent you the link via dms.`, color: Colors.Green, footer: {
                        text: `request id: ${commandId}`
                    }
                })
                await message.reply({ embeds: [self.Embed({ description: "Creating session id. Please wait...", color: Colors.Yellow })] }).then(async msg => {
                    await message.author.send({
                        embeds: [self.Embed({
                            color: Colors.Green,
                            title: "Temporary Cache Link",
                            fields: [{
                                name: `:link: Link:`,
                                value: `${self.env == "prod" ? "http://prem.daki.cc:6083" : "http://localhost:6969"}/api/luaobfuscator/stats/last-outage?session=${session_id}`
                            }, {
                                name: `${GetEmoji("warn")} Note:`,
                                value: `This temporary link is only available for ${inlineCode("1")} minute.`
                            }],
                            footer: {
                                text: session_id
                            },
                            timestamp: true
                        })]
                    }).catch(async err => await self.Debug(err, true))
                    msg.edit({ embeds: [finished_embed] }).catch(async err => await self.Debug(err, true))
                }).catch(async err => await self.Debug(err, true))
                await self.Debug(`> command requested. id: ${commandId}`)
            } catch (err) { console.error(err) }
        }
    }
}