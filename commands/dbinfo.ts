import { Colors, PermissionFlagsBits } from "discord.js";
import { commandHandler } from "../index"
import { Command } from "../modules/CommandHandler"
import Embed from "../modules/Misc/Embed";
import { PoolConnection } from "mariadb";
import Utils from "../modules/Utils";
import { pool } from "../modules/Database/Database";
import ErrorHandler from "../modules/ErrorHandler/ErrorHandler";
import config from "../config";

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

class CommandConstructor {
    name = ["dbinfo", "dbi"]
    category = commandHandler.CommandCategories.Admin
    description = "Returns informations about the LuaObfuscator database."
    permissions = [PermissionFlagsBits.Administrator]
    public_command = false
    direct_message = false
    hidden = true

    callback = async (cmd: Command) => {
        let connection: PoolConnection

        try {
            connection = await pool.getConnection()

            const _time = Date.now()
            await connection.ping()

            const embed = Embed({
                title: `${Utils.GetEmoji("info")} Lua Obfuscator - Database Information`,
                color: Colors.Green,
                timestamp: true,
                footer: {
                    iconURL: config.icon_url,
                    text: `${connection.serverVersion()} (${connection.info.threadId.toString()})`
                },
                fields: [ // @ts-ignore
                    { name: "Name:", value: `-# ${connection.info.database}`, inline: true },
                    { name: "\u200B", value: "\u200B", inline: true },
                    { name: "Status:", value: `-# ${statusFlags[connection.info.status] || connection.info.status.toString()}`, inline: true },
                    { name: "Connections:", value: `-# active: ${pool.activeConnections()}\n-# total: ${pool.totalConnections()}`, inline: true },
                    { name: "\u200B", value: "\u200B", inline: true },
                    { name: "Ping:", value: `-# ${(Date.now() - _time).toString()}ms`, inline: true },
                    { name: "Capabilities:", value: `-# ${Utils.FormatBytes(parseInt(connection.info.serverCapabilities.toString()))}`, inline: true },
                ]
            })

            cmd.message.reply({ embeds: [embed] })
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