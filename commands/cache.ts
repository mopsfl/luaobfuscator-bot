import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, PermissionFlagsBits, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";

class Command {
    name = ["cache"]
    category = self.commandCategories.Misc
    description = "Create a temporary link to access the cache. This command is for staff only!"
    permissions = [PermissionFlagsBits.Administrator]
    direct_message = false

    callback = async (cmd: cmdStructure) => {
        const embed = self.Embed({
            description: "Creating session id. Please wait...",
            color: Colors.Yellow
        })
        await cmd.message.reply({ embeds: [embed] }).then(async msg => {
            const session_id = await self.session.Create(60)
            const discord_buttons = [
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Last Outage")
                    .setURL(`${self.env == "prod" ? "http://prem.daki.cc:6083" : "http://localhost:6969"}/api/luaobfuscator/stats/last-outage?session=${session_id}`),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Outage Log")
                    .setURL(`${self.env == "prod" ? "http://prem.daki.cc:6083" : "http://localhost:6969"}/api/luaobfuscator/stats/outage-log?session=${session_id}`),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Obfuscator Stats")
                    .setURL(`${self.env == "prod" ? "http://prem.daki.cc:6083" : "http://localhost:6969"}/api/luaobfuscator/stats/obfuscator-stats?session=${session_id}`)
            ],
                row: any = new ActionRowBuilder().addComponents(...[discord_buttons])
            await cmd.message.author.send({
                embeds: [
                    self.Embed({
                        color: Colors.Green,
                        title: "Temporary Cache Link",
                        fields: [{
                            name: `${GetEmoji("warn")} Note:`,
                            value: `This temporary link is only available for ${inlineCode("1")} minute.`,
                            inline: false,
                        }],
                        footer: {
                            text: cmd.id
                        },
                        timestamp: true
                    })
                ],
                components: [row]
            })
            embed.setDescription(`${GetEmoji("yes")} Temporary cache link created. I've sent you the link via dms.`)
                .setColor(Colors.Green)
                .setFooter({ text: `${cmd.id}` })
                .setTimestamp()
            msg.edit({ embeds: [embed] }).catch(async err => await self.Debug(err, true))
        })
        return true
    }
}

module.exports = Command