import * as self from "../index"
import { Colors, Message, PermissionsBitField, codeBlock, inlineCode } from "discord.js"
import GetEmoji from "../modules/GetEmoji"
import fs from "fs"

export default function (message: Message) {
    return {
        enabled: true,
        command: "clearcache",
        aliases: ["cc", "clrc"],
        required_permissions: [PermissionsBitField.Flags.Administrator],

        arguments: "",

        allow_dm: true,
        ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

        callback: async () => {
            if (!self.client || !message) return

            const start_tick = new Date().getTime()
            const commandId = self.command.createCommandId()

            try {
                fs.readdir(process.cwd() + "/.cache", (err, files) => {
                    if (err) self.Debug(err, true)
                    let cache_files = "/.cache\n"
                    files.forEach(n => cache_files += `     | ${n.substr(0, 10) + "..." + n.substr(-10)}\n`)

                    const response_embed = self.Embed({
                        color: Colors.Yellow,
                        description: "Clearing cache. Please wait...",
                    })

                    message.reply({ embeds: [response_embed] }).then(async msg => {
                        const clearing_start_tick = new Date().getTime()
                        await self.cache.del("stats_session_ids")
                        await self.cache.del("debug")
                        await self.cache.set("stats_session_ids", [])
                        await self.cache.set("debug", [])
                        await self.file_cache.clear()
                        await self.file_cache.set("last_outage", { time: "N/A", affected_services: [] })
                        await self.file_cache.set("outage_log", { outages: [] })
                        msg.edit({
                            embeds: [self.Embed({
                                color: Colors.Green,
                                timestamp: true,
                                description: `${GetEmoji("yes")} Cache successfully cleared! (took ${inlineCode((new Date().getTime() - clearing_start_tick).toString() + "ms")})`,
                                fields: [
                                    { name: "Delete Cache Files:", value: codeBlock(cache_files) },
                                    { name: "Deleted Memory Cache Keys:", value: codeBlock(`Memory\n     | stats_session_ids\n     | debug`) },
                                ],
                                footer: { text: `request id: ${commandId}` },
                            })]
                        }).catch(async err => await self.Debug(err, true))
                    }).catch(async err => await self.Debug(err, true))
                })
                await self.Debug(`> command requested. id: ${commandId}`)
            } catch (err) { console.error(err) }
        }
    }
}