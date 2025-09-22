import { codeBlock, Colors, inlineCode, PermissionFlagsBits } from "discord.js";
import { pool, utils } from "../index"
import { cmdStructure } from "../modules/Command";
import CommandCategories from "../modules/CommandCategories";
import Embed from "../modules/Embed";
import { PoolConnection } from "mariadb";

const statusFlags = {
    2: "SERVER_STATUS_AUTOCOMMIT",
    4: "SERVER_MORE_RESULTS_EXISTS",
    8: "SERVER_STATUS_NO_GOOD_INDEX_USED",
    16: "SERVER_STATUS_NO_INDEX_USED",
    32: "SERVER_STATUS_CURSOR_EXISTS",
    64: "SERVER_STATUS_LAST_ROW_SENT",
    128: "SERVER_STATUS_DB_DROPPED",
    256: "SERVER_STATUS_NO_BACKSLASH_ESCAPES",
    512: "SERVER_STATUS_METADATA_CHANGED",
    1024: "SERVER_QUERY_WAS_SLOW",
    2048: "SERVER_PS_OUT_PARAMS",
    4096: "SERVER_STATUS_IN_TRANS",
    8192: "SERVER_STATUS_AUTOCOMMIT",
    16384: "SERVER_STATUS_IN_TRANS_READONLY",
    32768: "SERVER_SESSION_STATE_CHANGED"
};

class Command {
    name = ["dbinfo", "dbi"]
    category = CommandCategories.Misc
    description = "Returns informations about the LuaObfuscator database."
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    hidden = true

    callback = async (cmd: cmdStructure) => {
        let connection: PoolConnection

        try {
            const _t1 = Date.now()
            connection = await pool.getConnection()

            const _t2 = Date.now()
            await connection.ping()

            const embed = Embed({
                title: `:information: LuaObfuscator Database Information`,
                color: Colors.Green,
                footer: {
                    text: `threadId: ${connection.info.threadId.toString()} | took ${(Date.now() - _t1).toString()}ms`
                },
                fields: [
                    { name: "Server Version", value: `-# ${connection.serverVersion()}`, inline: true },
                    { name: "\u200B", value: "\u200B", inline: true },
                    { name: "Status", value: `-# ${statusFlags[connection.info.status] || connection.info.status.toString()}`, inline: true },
                    { name: "Active Connections", value: `-# ${pool.activeConnections()}`, inline: true },
                    { name: "Total Connections", value: `-# ${pool.totalConnections()}`, inline: true },
                    { name: "Ping", value: `-# ${(Date.now() - _t2).toString()}ms`, inline: true },
                ]
            })

            cmd.message.reply({ embeds: [embed] })
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