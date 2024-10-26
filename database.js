import sqlite3 from "sqlite3";

export default class Database {
  #db = null;

  async initDb() {
    this.#db = await new Promise((resolve, reject) => {
      let db = new sqlite3.Database("./database.db", (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }
        console.log("Successfully connected to SQLite");
        resolve(db);
      });
    });
    await new Promise((resolve, reject) => {
      this.#db.run(
        `CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)`,
        [],
        (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
            return;
          }
          console.log(`Successfully made sure table 'kv' exists`);
          resolve();
        },
      );
    });
  }

  async get(key) {
    let rows = await new Promise((resolve, reject) => {
      this.#db.all(`SELECT * FROM kv WHERE key = ?`, [key], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
    if (rows.length > 0) {
      return rows[0].value;
    } else {
      return "";
    }
  }

  async set(key, value) {
    await new Promise((resolve, reject) => {
      this.#db.run(
        `INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
        (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
            return;
          }
          console.log(
            `Successfully upserted value '${key}'='${JSON.stringify(value)}'`,
          );
          resolve();
        },
      );
    });
  }

  async delete(key) {
    let rows = await new Promise((resolve, reject) => {
      this.#db.all(`SELECT * FROM kv WHERE key = ?`, [key], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
    if (rows.length > 0) {
      await new Promise((resolve, reject) => {
        this.#db.run(`DELETE FROM kv WHERE key = ?`, [key], (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
            return;
          }
          console.log(`Successfully deleted '${key}'`);
          resolve();
        });
      });
    }
  }

  async list() {
    let rows = await new Promise((resolve, reject) => {
      this.#db.all(`SELECT * FROM kv`, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
    if (rows.length > 0) {
      return rows.map((row) => row.key).join("\n");
    } else {
      return "";
    }
  }
}
