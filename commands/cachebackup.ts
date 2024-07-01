import { Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import fastFolderSize from "fast-folder-size";
import FormatBytes from "../modules/FormatBytes";

class Command {
    name = ["cachebackup"]
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    direct_message = false
    category = self.commandCategories.Bot
    description = "Creates a backup of all cache keys and its values."

    callback = async (cmd: cmdStructure) => {
        const _cacheValues = {}
        const embed = self.Embed({
            title: "Cache Backup",
            description: `${GetEmoji("loading")} Fetching all cache values...`,
            color: Colors.Yellow,
            timestamp: true,
            footer: {
                text: `Lua Obfuscator Bot`,
                iconURL: self.config.icon_url,
            }
        })

        fastFolderSize(process.cwd() + "/.cache", async (err, bytes) => {
            if (err) return console.error(err)

            let _timeGetCache = new Date().getTime()
            await cmd.message.reply({ embeds: [embed] }).then(async msg => {
                Object.keys(self.cacheValues).forEach(async (ckey, idx) => {
                    _cacheValues[ckey] = await self.file_cache.get(ckey).catch(console.error)

                    if ((idx + 1) === Object.keys(self.cacheValues).length) {
                        const _timeGetCacheDone = `${new Date().getTime() - _timeGetCache}ms`
                        embed.setDescription(`${GetEmoji("yes")} Cache values fetched. (took ${inlineCode(_timeGetCacheDone)})\n${GetEmoji("loading")} Uploading cache data...`)
                        msg.edit({ embeds: [embed] })
                        let _timeUploadCache = new Date().getTime()

                        await fetch(process.env.CLOUDFLARE_KV_APIURL + process.env.CLOUDFLARE_KV_BACKUP_KEY, {
                            method: "POST",
                            body: JSON.stringify({ value: self.utils.ToBase64(JSON.stringify(_cacheValues)), metadata: { time: new Date().getTime(), saved_keys: Object.keys(self.cacheValues) } })
                        }).then(res => res.json()).then((res: CloudflareKVResponse) => {
                            if (res.success) {
                                embed.setDescription(`${GetEmoji("yes")} Cache values fetched. (took ${inlineCode(_timeGetCacheDone)})\n${GetEmoji("yes")} Cache data uploaded! (took ${inlineCode(`${new Date().getTime() - _timeUploadCache}ms`)})\n\nBackup Size: ${inlineCode(FormatBytes(bytes))}`)
                                embed.setColor(Colors.Green)
                                msg.edit({ embeds: [embed] })
                            } else {
                                embed.setDescription(`${GetEmoji("yes")} Cache values fetched. (took ${inlineCode(_timeGetCacheDone)})\n${GetEmoji("no")} Error while uploading cache data! (code: ${res.errors[0].code})`)
                                embed.setColor(Colors.Red)
                                msg.edit({ embeds: [embed] })
                            }
                        })
                    }
                })
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