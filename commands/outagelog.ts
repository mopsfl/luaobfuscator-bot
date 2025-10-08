import { Colors, inlineCode } from "discord.js";
import { commandHandler, ENV } from "../index"
import config from "../config";
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import Session from "../modules/Misc/Session";
import Utils from "../modules/Utils";

class CommandConstructor {
    name = ["outagelog", "ol", "outlog"]
    category = commandHandler.CommandCategories.Misc
    description = "Returns you a link to view the full outage history of [luaobfuscator.com](https://luaobfuscator.com)."
    public_command = false
    direct_message = false

    callback = async (cmd: Command) => {
        const session = await Session.Create(300),
            apiURL = `${ENV == "prod" ? process.env.SERVER : "http://localhost:6969"}`

        await cmd.message.author.send({
            embeds: [Embed({
                timestamp: true,
                color: Colors.Green,
                title: "Outage Log",
                description: `This temporary link is only available for ${inlineCode(Utils.FormatUptime(300 * 1000))}.`,
                fields: [
                    {
                        name: "Link:",
                        value: `[Outage Log](${apiURL}/outagehistory?s=${session})`,
                        inline: false
                    },
                    {
                        name: "Session ID:",
                        value: inlineCode(session),
                        inline: false
                    },
                ],
                footer: {
                    text: "Lua Obfuscator",
                    iconURL: config.icon_url
                }
            })]
        }).catch(error => {
            Utils.SendErrorMessage("error", cmd, error.message)
            console.error(error)
        }).then(() => {
            cmd.message.reply("I have sent you the link via DM's!")
        })
    }
}

module.exports = CommandConstructor