// my database module thing but i used chatgpt to make it cleaner and stuff yk cuz before it looks hella goofy lol :3

import mariadb from "mariadb"
import {
  DBResponse,
  ok, fail,
  buildSetClause,
  buildWhereClause
} from "./Helpers";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 50,
})

export type DatabaseTable =
  | "bot_statistics"
  | "cmd_stats"
  | "obfuscator_stats"
  | "customplugin_saves"
  | "nohello_stats"
  | "outage_log";

export default {
  async Execute<T = any>(sql: string, params: any[] = []): Promise<DBResponse<T[]>> {
    try {
      const rows = await pool.query(sql, params);
      return rows.length ? ok(rows) : fail("notFound", "No rows found", 404);
    } catch (err: any) {
      console.error(err);
      return fail(err.code ?? "queryError", err.message ?? "Query failed");
    }
  },

  async GetTable<T = any>(
    table: DatabaseTable,
    reqQuery?: Record<string, any>,
    latest = false,
    limit?: number,
    desc?: boolean
  ): Promise<DBResponse<T | T[]>> {
    try {
      const { clause, value } = buildWhereClause(reqQuery);
      let sql = `SELECT * FROM \`${table}\`${clause ? " WHERE " + clause : ""}`;
      if (latest) { sql += " ORDER BY time DESC" } else if (desc) { sql += " ORDER BY time DESC" }
      if (latest) { sql += " LIMIT 1" } else if (limit) { sql += ` LIMIT ${limit}` }

      const rows = await pool.query(sql, clause ? [value] : []);
      if (!rows.length) return fail("notFound", "No rows found", 404);

      return ok(latest || clause ? rows[0] : rows);
    } catch (err: any) {
      console.error(err);
      return fail(err.code ?? "queryError", err.message ?? "Query failed");
    }
  },

  async Insert(table: DatabaseTable, values: Record<string, any>): Promise<DBResponse<any>> {
    try {
      const columns = Object.keys(values).map(c => `\`${c}\``).join(", "),
        placeholders = Object.keys(values).map(() => "?").join(", "),
        sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`;

      const result = await pool.query(sql, Object.values(values));
      return ok(result);
    } catch (err: any) {
      console.error(err);
      return fail(err.code ?? "insertError", err.message ?? "Insert failed");
    }
  },

  async Update(
    table: DatabaseTable,
    updates: Record<string, any>,
    reqQuery: Record<string, any>
  ): Promise<DBResponse<any>> {
    try {
      const { clause, value } = buildWhereClause(reqQuery);
      if (!clause) return fail("invalidQuery", "Missing WHERE condition", 400);

      const sql = `UPDATE \`${table}\` SET ${buildSetClause(updates)} WHERE ${clause}`,
        result = await pool.query(sql, [...Object.values(updates), value]);

      return result.affectedRows > 0 ? ok(result) : fail("notFound", "No rows updated", 404);
    } catch (err: any) {
      console.error(err);
      return fail(err.code ?? "updateError", err.message ?? "Update failed");
    }
  },

  async Delete(table: DatabaseTable, reqQuery: Record<string, any>): Promise<DBResponse<any>> {
    try {
      const { clause, value } = buildWhereClause(reqQuery);
      if (!clause) return fail("invalidQuery", "Missing WHERE condition", 400);

      const sql = `DELETE FROM \`${table}\` WHERE ${clause}`,
        result = await pool.query(sql, [value]);

      return result.affectedRows > 0 ? ok(result) : fail("notFound", "No rows deleted", 404);
    } catch (err: any) {
      console.error(err);
      return fail(err.code ?? "deleteError", err.message ?? "Delete failed");
    }
  },

  async RowExists(table: DatabaseTable, reqQuery?: Record<string, any>): Promise<boolean> {
    try {
      const { clause, value } = buildWhereClause(reqQuery),
        sql = `SELECT 1 FROM \`${table}\`${clause ? " WHERE " + clause : ""} LIMIT 1`,
        rows = await pool.query(sql, clause ? [value] : []);

      return rows.length > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  async Increment(
    table: DatabaseTable,
    column: string,
    reqQuery?: Record<string, any>
  ): Promise<DBResponse<boolean>> {
    try {
      const { clause, value } = buildWhereClause(reqQuery),
        sql = `UPDATE \`${table}\` SET \`${column}\` = \`${column}\` + 1${clause ? " WHERE " + clause : ""}`;

      const result = await pool.query(sql, clause ? [value] : []);
      return result.affectedRows > 0 ? ok(true) : fail("notFound", "No rows updated", 404);
    } catch (err: any) {
      console.error(err);
      return fail(err.code ?? "incrementError", err.message ?? "Increment failed");
    }
  }
};

export { pool }