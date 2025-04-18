import { codeBlock, Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import GetEmoji from "../modules/GetEmoji";
import { PoolConnection } from "mariadb";

const block = [
    "DELETE",
    "DROP TABLE",
    "DROP DATABASE",
    "TRUNCATE"
]

class Command {
    name = ["dbinfo", "dbi"]
    category = CommandCategories.Misc
    description = "Returns informations about the LuaObfuscator database."
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false

    callback = async (cmd: cmdStructure) => {
        let connection: PoolConnection

        try {
            const _t1 = new Date().getTime()
            connection = await self.pool.getConnection()

            const _t2 = new Date().getTime()
            await connection.ping()

            const embed = Embed({
                title: `:information: LuaObfuscator Database Information`,
                color: Colors.Green,
                footer: {
                    text: `threadId: ${connection.info.threadId.toString()} | ${(new Date().getTime() - _t1).toString()}ms`
                },
                fields: [
                    { name: "Server Version", value: inlineCode(connection.serverVersion()), inline: true },
                    { name: "Status", value: inlineCode(connection.info.status.toString()), inline: true },
                    { name: "Ping", value: `\`${(new Date().getTime() - _t2).toString()}ms\``, inline: false },
                ]
            })

            cmd.message.reply({ embeds: [embed] })
        } catch (error) {
            self.utils.SendErrorMessage("error", cmd, error.message)
            console.error(error)
        } finally {
            if (connection) connection.release()
        }

        return true
    }
}

module.exports = Command