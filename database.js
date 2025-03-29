import { default as DatabaseImpl } from "better-sqlite3";

export default class Database {
  #db = null;

  async initDb() {
    this.#db = await new Promise((resolve, reject) => {
      try {
        let db = new DatabaseImpl("./database.db");
        console.log("Successfully connected to SQLite");
        resolve(db);
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
    await new Promise((resolve, reject) => {
      try {
        const stmt = this.#db.prepare(
          "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)",
        );
        stmt.run(); // Do not care about the changes made as long as it is successful
        console.log(`Successfully made sure table 'kv' exists`);
        resolve();
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  }

  async get(key) {
    let rows = await new Promise((resolve, reject) => {
      try {
        const stmt = this.#db.prepare("SELECT * FROM kv WHERE key = ?");
        const rows = stmt.all(key);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    });
    if (rows.length > 0) {
      if (rows.length > 1) {
        console.warn(`[GET] Warning: more than 1 row found for key ${key}`);
      }
      return rows[0].value;
    } else {
      return "";
    }
  }

  async set(key, value) {
    await new Promise((resolve, reject) => {
      try {
        const stmt = this.#db.prepare(
          "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        );
        stmt.run(key, value); // Do not care about the changes made as long as it is successful
        console.log(
          `Successfully upserted value '${key}'='${JSON.stringify(value)}'`,
        );
        resolve();
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  }

  async delete(key) {
    let rows = await new Promise((resolve, reject) => {
      try {
        const stmt = this.#db.prepare("SELECT * FROM kv WHERE key = ?");
        const rows = stmt.all(key);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    });
    if (rows.length > 0) {
      if (rows.length > 1) {
        console.warn(`[DELETE] Warning: more than 1 row found for key ${key}`);
      }
      await new Promise((resolve, reject) => {
        try {
          const stmt = this.#db.prepare("DELETE FROM kv WHERE key = ?");
          stmt.run(key); // Do not care about the changes made as long as it is successful
          console.log(`Successfully deleted '${key}'`);
          resolve();
        } catch (err) {
          console.error(err);
          reject(err);
        }
      });
    }
  }

  async list() {
    let rows = await new Promise((resolve, reject) => {
      try {
        const stmt = this.#db.prepare("SELECT * FROM kv");
        const rows = stmt.all();
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    });
    if (rows.length > 0) {
      return rows.map((row) => row.key).join("\n");
    } else {
      return "";
    }
  }
}
