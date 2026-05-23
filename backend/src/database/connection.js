import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { env } from "../config/env.js";

let db;

export function getDatabase() {
  if (!db) {
    const databaseDir = path.dirname(env.databasePath);

    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
    }

    db = new Database(env.databasePath);

    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}
