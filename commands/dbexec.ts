import { Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import { pool, utils } from "../index"
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
    name = ["dbexec", "dbex", "dbx"]
    category = CommandCategories.Misc
    description = "test command for the db."
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    hidden = true

    callback = async (cmd: cmdStructure) => {
        let connection: PoolConnection,
            _block = false

        block.forEach(q => {
            if (cmd.raw_arguments.toLowerCase().includes(q.toLowerCase())) {
                _block = true
                return
            }
        })

        if (_block) return cmd.message.reply({
            embeds: [Embed({
                description: `${GetEmoji("no")} This function is blocked :)`,
                color: Colors.Red
            })]
        })

        try {
            const _t = new Date().getTime()
            connection = await pool.getConnection()

            const query = cmd.raw_arguments
            const res = await connection.query(query)

            if (res) {
                const attachment = utils.CreateFileAttachment(Buffer.from(JSON.stringify(res, null, 2)), `mariadb_result_${connection.threadId}.json`)
                cmd.message.reply({
                    files: [attachment], content: `-# query: ${inlineCode(query)}\n-# took: \`${new Date().getTime() - _t}ms\`\n-# threadId: ${inlineCode(connection.threadId.toString())}`
                })
            }
        } catch (error) {
            utils.SendErrorMessage("error", cmd, error.message)
            console.error(error)
        } finally {
            if (connection) connection.release()
        }

        return true
    }
}

module.exports = Command