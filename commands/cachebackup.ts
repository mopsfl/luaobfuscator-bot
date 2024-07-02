import { Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import fastFolderSize from "fast-folder-size";
import FormatBytes from "../modules/FormatBytes";
import { gzipSync } from "zlib";
import { CloudflareKVResponse } from "./getcachebackup";
import CacheBackup from "../modules/CacheBackup";

class Command {
    name = ["cachebackup"]
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    direct_message = false
    category = self.commandCategories.Misc
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

            await cmd.message.reply({ embeds: [embed] }).then(async msg => {
                let _timeGetCache = new Date().getTime()
                Object.keys(self.cacheValues).forEach(async (ckey, idx) => {
                    _cacheValues[ckey] = await self.file_cache.get(ckey).catch(console.error)

                    if ((idx + 1) === Object.keys(self.cacheValues).length) {
                        const _timeGetCacheDone = `${new Date().getTime() - _timeGetCache}ms`
                        embed.setDescription(`${GetEmoji("yes")} Cache values fetched. (took ${inlineCode(_timeGetCacheDone)})\n${GetEmoji("loading")} Uploading cache data...`)
                        msg.edit({ embeds: [embed] })
                        let _timeUploadCache = new Date().getTime()

                        try {
                            CacheBackup.CreateBackup().then((res: CloudflareKVResponse) => {
                                if (res.success) {
                                    embed.setDescription(`${GetEmoji("yes")} Cache values fetched. (took ${inlineCode(_timeGetCacheDone)})\n${GetEmoji("yes")} Cache data uploaded! (took ${inlineCode(`${new Date().getTime() - _timeUploadCache}ms`)})\n\nBackup Size: ${inlineCode(FormatBytes(bytes))}`)
                                    embed.setColor(Colors.Green)
                                    msg.edit({ embeds: [embed] })
                                } else {
                                    embed.setDescription(`${GetEmoji("yes")} Cache values fetched. (took ${inlineCode(_timeGetCacheDone)})\n${GetEmoji("no")} Error while uploading cache data! (code: ${res.errors[0].code})`)
                                    embed.setColor(Colors.Red)
                                    msg.edit({ embeds: [embed] })
                                }
                            }).catch(async error => {
                                embed.setDescription(`${GetEmoji("no")} Failed to upload backup!`)
                                embed.setColor(Colors.Red)
                                await msg.edit({ embeds: [embed] })
                                self.utils.SendErrorMessage("error", cmd, error)
                                return
                            })
                        } catch (error) {
                            console.error(error)
                            embed.setDescription(`${GetEmoji("no")} Failed to upload backup!`)
                            embed.setColor(Colors.Red)
                            await msg.edit({ embeds: [embed] })
                            self.utils.SendErrorMessage("error", cmd, error)
                            return
                        }
                    }
                })
            })
        })

        return true
    }
}

module.exports = Command