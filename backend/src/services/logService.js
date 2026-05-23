import { getDatabase } from "../database/connection.js";

export function createLog({
  deployment_id = null,
  vps_id = null,
  type,
  level,
  message,
}) {
  const db = getDatabase();

  const now = new Date().toISOString();

  const result = db
    .prepare(
      `
      INSERT INTO logs (
        deployment_id,
        vps_id,
        type,
        level,
        message,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(deployment_id, vps_id, type, level, message, now);

  return {
    id: result.lastInsertRowid,
    deployment_id,
    vps_id,
    type,
    level,
    message,
    created_at: now,
  };
}
