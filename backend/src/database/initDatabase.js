import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabase } from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initDatabase() {
  const db = getDatabase();

  const schemaPath = path.resolve(__dirname, "../../../database/schema.sql");

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`No se encontró el archivo schema.sql en: ${schemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, "utf-8");

  db.exec(schema);

  console.log("Base de datos SQLite inicializada correctamente");
}
