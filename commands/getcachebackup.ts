import { Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import fastFolderSize from "fast-folder-size";
import FormatBytes from "../modules/FormatBytes";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";

class Command {
    name = ["getcachebackup"]
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    direct_message = false
    category = CommandCategories.Misc
    description = "Gets the cache backup."

    callback = async (cmd: cmdStructure) => {
        const _cacheValues = {}
        const embed = Embed({
            title: "Cache Backup",
            description: `${GetEmoji("loading")} Fetching backup...`,
            color: Colors.Yellow,
            timestamp: true,
            footer: {
                text: `Lua Obfuscator Bot`,
                iconURL: self.config.icon_url,
            }
        })

        await cmd.message.reply({ embeds: [embed] }).then(async msg => {
            let _timeGetBackup = new Date().getTime()
            await fetch(process.env.CLOUDFLARE_KV_GETAPIURL + process.env.CLOUDFLARE_KV_BACKUP_KEY, {
                method: "GET",
            }).then(res => res.text()).then(async (res: any) => {
                const _timeGetBackupDone = `${new Date().getTime() - _timeGetBackup}ms`
                embed.setDescription(`${GetEmoji("yes")} Backup fetched! (took ${inlineCode(_timeGetBackupDone)})\n${GetEmoji("loading")} Creating file attachment...`)
                msg.edit({ embeds: [embed] })

                const file_attachment = self.utils.CreateFileAttachment(Buffer.from(res), `backup.txt`)
                if (typeof file_attachment != "object") {
                    embed.setDescription(`${GetEmoji("yes")} Backup fetched! (took ${inlineCode(_timeGetBackupDone)})\n${GetEmoji("no")} Creating file attachment failed!`)
                    embed.setColor(Colors.Red)
                    return msg.edit({ embeds: [embed] })
                } else {
                    embed.setDescription(`${GetEmoji("yes")} Backup fetched! (took ${inlineCode(_timeGetBackupDone)})\n${GetEmoji("yes")} File attachment created!\n${GetEmoji("yes")} Sending backup to your dm's!`)
                    embed.setColor(Colors.Green)
                    msg.edit({ embeds: [embed] })
                    await cmd.message.author.send({ files: [file_attachment] }).catch(async err => {
                        embed.setColor(Colors.Red)
                            .setDescription(`${GetEmoji("no")} Please change your ${inlineCode("Privacy Setting")} so I can send you the results in your Direct Messages.`)
                        await msg.edit({ embeds: [embed] })
                        console.error(err)
                    })
                }

            }).catch(async error => {
                embed.setDescription(`${GetEmoji("no")} Failed to fetch backup!`)
                embed.setColor(Colors.Red)
                await msg.edit({ embeds: [embed] })
                self.utils.SendErrorMessage("error", cmd, error)
                return
            })
        })

        return true
    }
}

export interface CloudflareKVResponse {
    "errors": Array<any>,
    "messages": Array<any>,
    "success": boolean,
    "result": Object
}

module.exports = Command