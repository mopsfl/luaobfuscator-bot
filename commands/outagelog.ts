import { Colors, inlineCode } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import Session from "../modules/Session";
import FormatUptime from "../modules/FormatUptime";

class Command {
    name = ["outagelog", "ol", "outlog"]
    category = CommandCategories.Misc
    description = "Grants temporary access to the complete outage log for all luaobfuscator.com services."
    public_command = false

    callback = async (cmd: cmdStructure) => {
        const session = await Session.Create(300),
            apiURL = `${self.env == "prod" ? process.env.SERVER : "http://localhost:6969"}`

        await cmd.message.author.send({
            embeds: [Embed({
                timestamp: true,
                color: Colors.Green,
                title: "Outage Log",
                description: `This temporary link is only available for ${inlineCode(FormatUptime(300 * 1000))}.`,
                fields: [
                    {
                        name: "Link:",
                        value: `[Outage Log](${apiURL}/outagelog?session=${session})`,
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
                    iconURL: self.config.icon_url
                }
            })]
        }).catch(error => {
            self.utils.SendErrorMessage("error", cmd, error.message)
            console.error(error)
        }).then(() => {
            cmd.message.reply("I have sent you the link via DM's!")
        })

        return true
    }
}

module.exports = Command