import { Colors, PermissionFlagsBits, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";
import { Bot_Settings } from "../index";

class Command {
    name = ["alert"]
    category = self.commandCategories.Misc
    description = "Toggles the api outage alert pings."
    permissions = [PermissionFlagsBits.Administrator]
    direct_message = false

    callback = async (cmd: cmdStructure) => {
        const embed = self.Embed({
            title: "Bot Settings",
            description: `${GetEmoji("loading")} Changing setting, please wait.`,
            color: Colors.Yellow,
            timestamp: true,
            footer: {
                text: `Lua Obfuscator Bot`,
                iconURL: self.config.icon_url,
            }
        })

        cmd.message.reply({ embeds: [embed] }).then(async msg => {
            const bot_settings: Bot_Settings = await self.file_cache.get("bot_settings")
            bot_settings.alert_pings = !bot_settings.alert_pings;
            await self.file_cache.set("bot_settings", bot_settings)

            embed.setDescription(`${GetEmoji("yes")} Setting ${inlineCode("alert_pings")} set to ${inlineCode(bot_settings.alert_pings.toString())}.`)
                .setColor(Colors.Green)

            msg.edit({ embeds: [embed] })
        })



        return true
    }
}

module.exports = Command
