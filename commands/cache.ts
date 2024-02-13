import { ActionRowBuilder, AnyComponentBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, Colors, EmbedField, PermissionFlagsBits, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import FormatNumber from "../modules/FormatNumber";
import FormatUptime from "../modules/FormatUptime";

const cache_names: Array<Array<any>> = [
    ["last_outage", "Last Outage"],
    ["outage_log", "Outage Log"],
    ["bot_stats", "Bot Stats"],
    ["cmd_stats", "Command Stats"],
    ["obfuscator_stats", "Obfuscator Stats"],
    ["bot_settings", "Bot Settings"],
    ["error_logs", "Error Logs"],
    ["status_display", "Status Display"]
],
    _sessionExpireTime = 90

class Command {
    name = ["cache"]
    category = self.commandCategories.Misc
    description = "Create a temporary link to access some data from the cache."
    permissions = [PermissionFlagsBits.Administrator]
    direct_message = false

    callback = async (cmd: cmdStructure) => {
        const embed = self.Embed({
            description: "Creating session id. Please wait...",
            color: Colors.Yellow
        }),
            _apiURL = `${self.env == "prod" ? process.env.SERVER : "http://localhost:6969"}`

        await cmd.message.reply({ embeds: [embed] }).then(async msg => {
            const session_id = await self.session.Create(_sessionExpireTime),
                discord_buttons: Array<EmbedField> = []

            cache_names.forEach(_cacheName => {
                if (typeof (_cacheName[1]) !== "string" || typeof (_cacheName[1]) !== "string") return
                discord_buttons.push({
                    name: _cacheName[1],
                    value: `[/cache/${_cacheName[0]}](${_apiURL}/api/v1/cache/${_cacheName[0]}?session=${session_id})`,
                    inline: true
                })
            })

            embed.setDescription(`${GetEmoji("yes")} Temporary cache link created. I've sent you the link via dms.`)
                .setColor(Colors.Green)
                .setFooter({ text: `${cmd.id}` })
                .setTimestamp()
            await msg.edit({ embeds: [embed] }).catch(async err => await self.Debug(err, true))
            await cmd.message.author.send({
                embeds: [
                    self.Embed({
                        color: Colors.Green,
                        title: "Temporary Cache Link",
                        fields: [{
                            name: `${GetEmoji("warn")} Note:`,
                            value: `This temporary link is only available for ${inlineCode(FormatUptime(_sessionExpireTime * 1000))}.`,
                            inline: false,
                        }, ...discord_buttons],
                        footer: {
                            text: cmd.id
                        },
                        timestamp: true
                    })
                ]
            }).catch(async err => {
                embed.setColor(Colors.Red)
                    .setDescription(`${GetEmoji("no")} Please change your ${inlineCode("Privacy Setting")} so I can send you the results in your Direct Messages.`)
                await msg.edit({ embeds: [embed] })
                console.error(err)
            })
        })
        return true
    }
}

module.exports = Command