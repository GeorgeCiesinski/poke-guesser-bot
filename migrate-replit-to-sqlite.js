import "dotenv/config";
import ReplitClient from "@replit/database";
import sqlite3 from "sqlite3";

async function handleSqlite(keyValuePair) {
  let db = await new Promise((resolve, reject) => {
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
    db.run(
      `CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)`,
      [],
      (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }
        console.log(`Successfully created table kv`);
        resolve();
      },
    );
  });
  for (let key of Object.keys(keyValuePair)) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [
          key,
          typeof keyValuePair[key] == "string"
            ? keyValuePair[key]
            : JSON.stringify(keyValuePair[key]),
        ],
        (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
            return;
          }
          console.log(
            `Successfully inserted or updated value '${key}'='${typeof keyValuePair[key] == "string" ? keyValuePair[key] : JSON.stringify(keyValuePair[key])}'`,
          );
          resolve();
        },
      );
    });
  }
  await db.close();
}

const dbClient = new ReplitClient();

const listResponse = await dbClient.list();

if (listResponse.ok) {
  let keyValuePair = {};
  for (const listEntry of listResponse.value) {
    const value = await dbClient.get(listEntry);
    if (value.ok) {
      keyValuePair[listEntry] = value.value;
    } else {
      console.log(`Not ok (${listEntry}):\n`, value);
    }
  }
  await handleSqlite(keyValuePair);
} else {
  console.log("Not ok:\n", listResponse);
  process.exit(1);
}
