import { Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import { pool, utils } from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import { PoolConnection } from "mariadb";

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

        if (cmd.message.author.id !== "1111257318961709117") return cmd.message.reply("srry baby gurl this is only for mopsfl :p")
        block.forEach(q => {
            if (cmd.raw_arguments.toLowerCase().includes(q.toLowerCase())) {
                _block = true
                return
            }
        })

        if (_block) return cmd.message.reply({
            embeds: [Embed({
                description: `${utils.GetEmoji("no")} This function is blocked :)`,
                color: Colors.Red
            })]
        })

        try {
            const _t = Date.now()
            connection = await pool.getConnection()

            const query = cmd.raw_arguments
            const res = await connection.query(query)
            if (res) {
                const attachment = utils.CreateFileAttachment(Buffer.from(JSON.stringify(res, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)), `mariadb_result_${connection.threadId}.json`);
                cmd.message.reply({ //@ts-ignore
                    files: [attachment], content: `-# query: ${inlineCode(query)}\n-# took: \`${Date.now() - _t}ms\`\n-# threadId: ${inlineCode(connection.threadId.toString())}\n-# status: \`${getReadableStatus(connection.info.status)} (${connection.info.status})\`\n-# seed: \`${connection.info.seed.toString()}\``
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