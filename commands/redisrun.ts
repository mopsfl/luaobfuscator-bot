import { codeBlock, Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import GetEmoji from "../modules/GetEmoji";

class Command {
    name = ["redisrun", "rdr"]
    category = CommandCategories.Misc
    description = "test command to run a command with a redis server."
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false

    callback = async (cmd: cmdStructure) => {
        const keyName = cmd.arguments[0].toString(),
            value = cmd.raw_arguments.slice(keyName.toString().length + 1).toString()

        const embed = Embed({
            title: `redis ${self.redisClient.info.redis_version} • ${self.redisClient.info.run_id}`,
            description: `${GetEmoji("loading")} Processing request...`,
            color: Colors.Yellow,
            timestamp: true,
            footer: {
                text: `os: ${self.redisClient.info.os}`
            }
        })
        await cmd.message.reply({ embeds: [embed] }).then(msg => {
            const start_tick = new Date().getTime()
            self.redisClient.RunCommand(cmd.raw_arguments).then(res => {
                res = res.toString()
                const output = typeof res === 'string' && res.length > 1000 ? res.slice(0, 1000) + '...' : res;
                embed.setDescription(`${GetEmoji("yes")} Request finished!`)
                    .setFields([{
                        name: "Response",
                        value: codeBlock(output),
                        inline: false
                    }, {
                        name: "Took",
                        value: inlineCode((new Date().getTime() - start_tick).toString() + "ms"),
                        inline: true
                    }]).setColor(output?.includes("Error:") ? Colors.Red : Colors.Green)
                msg.edit({ embeds: [embed] })
            }).catch(err => {
                embed.setDescription(`${GetEmoji("no")} Request failed!`).setFields([{
                    name: "Response",
                    value: codeBlock(err),
                    inline: false
                }]).setColor(Colors.Red)
                msg.edit({ embeds: [embed] })
            })
        })
        return true
    }
}

module.exports = Command