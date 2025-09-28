import { Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import { commandHandler } from "../index"
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import { PoolConnection } from "mariadb";
import Utils from "../modules/Utils";
import { pool } from "../modules/Database/Database";
import ErrorHandler from "../modules/ErrorHandler/ErrorHandler";

const block = [
    "DELETE",
    "DROP TABLE",
    "DROP DATABASE",
    "TRUNCATE",
    "DROP"
]

const STATUS_FLAGS: Record<number, string> = {
    1: "IN_TRANS",
    2: "AUTOCOMMIT",
    4: "MORE_RESULTS_EXISTS",
    8: "NO_GOOD_INDEX_USED",
    16: "NO_INDEX_USED",
    32: "CURSOR_EXISTS",
    64: "LAST_ROW_SENT",
    128: "DB_DROPPED",
    256: "NO_BACKSLASH_ESCAPES",
    512: "METADATA_CHANGED",
    1024: "QUERY_WAS_SLOW",
    2048: "PS_OUT_PARAMS",
    4096: "IN_TRANS_READONLY",
    8192: "SESSION_STATE_CHANGED"
};

function getReadableStatus(statusNumber: number): string[] {
    return Object.entries(STATUS_FLAGS)
        .filter(([bit, _]) => (statusNumber & Number(bit)) !== 0)
        .map(([_, name]) => name);
}

class CommandConstructor {
    name = ["dbexec", "dbex", "dbx"]
    category = commandHandler.CommandCategories.Admin
    description = "command to execute sql queries to the database"
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    hidden = true

    callback = async (cmd: Command) => {
        let connection: PoolConnection,
            _block = false

        if (cmd.message.author.id !== "1111257318961709117") return cmd.message.reply("srry baby gurl this is only for mopsfl :p")
        block.forEach(q => {
            if (cmd.raw_arguments.toLowerCase().includes(q.toLowerCase())) {
                _block = true
                return
            }
        })

        if (_block) return cmd.message.reply({
            embeds: [Embed({
                description: `${Utils.GetEmoji("no")} This function is blocked :)`,
                color: Colors.Red
            })]
        })

        try {
            const _t = Date.now()
            connection = await pool.getConnection()

            const query = cmd.raw_arguments
            const res = await connection.query(query)
            if (res) {
                const attachment = Utils.CreateFileAttachment(Buffer.from(JSON.stringify(res, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)), `mariadb_result_${connection.threadId}.json`);
                cmd.message.reply({ //@ts-ignore
                    files: [attachment], content: `-# query: ${inlineCode(query)}\n-# took: \`${Date.now() - _t}ms\`\n-# threadId: ${inlineCode(connection.threadId.toString())}\n-# status: \`${getReadableStatus(connection.info.status)} (${connection.info.status})\`\n-# seed: \`${connection.info.seed.toString()}\``
                })
            }
        } catch (error) {
            return ErrorHandler.new({
                message: cmd.message,
                error: error,
                title: "Database Error"
            })
        } finally {
            if (connection) connection.release()
        }
    }
}

module.exports = CommandConstructor