// my goofy ahh database module thing. works so dont blame me -.-

import { PoolConnection } from "mariadb";
import { pool } from "..";
import self from "./Database"

export type DatabaseTable = "bot_statistics" | "cmd_stats"

export default {
    async GetTable(table: DatabaseTable, reqQuery?: any): Promise<[any, string?, number?]> {
        let connection: PoolConnection

        try {
            connection = await pool.getConnection();

            const [queryName, queryValue] = reqQuery && self.ParseSearchQuery(reqQuery) || [];
            const query = `SELECT * FROM ${table}${queryName ? ` WHERE ${queryName} = ?` : ""}`;
            const rows = await connection.query(query, queryName ? [queryValue] : []);

            return rows.length ? (queryName ? [rows[0]] : [rows]) : [null, "databaseNotFound", 404];
        } catch (err) {
            console.error(err)
            return [null, err.code, err.message]
        } finally {
            if (connection) connection.release();
        }
    },

    async RowExists(table: DatabaseTable, reqQuery?: any): Promise<[any, string?, number?]> {
        let connection: PoolConnection

        try {
            connection = await pool.getConnection();

            const [queryName, queryValue] = self.ParseSearchQuery(reqQuery) || [];
            const query = `SELECT * FROM ${table}${queryName ? ` WHERE ${queryName} = ?` : ""}`;
            const rows = await connection.query(query, queryName ? [queryValue] : []);

            return [rows.length > 0]
        } catch (err) {
            console.error(err)
            return [null, err.code, err.message]
        } finally {
            if (connection) connection.release();
        }
    },

    async Insert(table: DatabaseTable, values: Object) {
        let connection: PoolConnection

        try {
            connection = await pool.getConnection();

            let _values = "",
                _valuesC = ""
            Object.keys(values).forEach(v => {
                _values = _values + `${v}, `
                _valuesC = _valuesC + `?, `
            });
            _values = _values.replace(/,\s+$/gm, "")
            _valuesC = _valuesC.replace(/,\s+$/gm, "")

            const query = `INSERT INTO ${table} (${_values}) VALUES (${_valuesC});`
            const result = await connection.query(query, Object.values(values))

        } catch (err) {
            console.error(err)
            return [null, err.code, err.message]
        } finally {
            if (connection) connection.release();
        }
    },

    async Increment(table: DatabaseTable, value: string, reqQuery?: any): Promise<[boolean, string?, number?]> {
        let connection: PoolConnection

        try {
            connection = await pool.getConnection();
            const [queryName, queryValue] = reqQuery ? self.ParseSearchQuery(reqQuery) : [];
            const query = `UPDATE ${table} SET ${value} = ${value} + 1${queryName ? ` WHERE ${queryName} = ?` : ""}`;
            const result = await connection.query(query, queryName ? [queryValue] : []);

            return result.affectedRows > 0 ? [true, null, 200] : [false, "databaseNotFound", 404];
        } catch (err) {
            console.error(err)
            return [false, err.code, err.message]
        } finally {
            if (connection) connection.release();
        }
    },

    ParseSearchQuery(query: any): [string, string] {
        const queryName = Object.keys(query)[0]
        if (!queryName) return [null, null]

        return [queryName, query[queryName]]
    }
}