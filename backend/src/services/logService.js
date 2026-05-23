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

export function getLogs({ vps_id, deployment_id, type, level, limit = 100 }) {
  const db = getDatabase();

  const conditions = [];
  const params = [];

  if (vps_id) {
    conditions.push("logs.vps_id = ?");
    params.push(Number(vps_id));
  }

  if (deployment_id) {
    conditions.push("logs.deployment_id = ?");
    params.push(Number(deployment_id));
  }

  if (type) {
    conditions.push("logs.type = ?");
    params.push(type);
  }

  if (level) {
    conditions.push("logs.level = ?");
    params.push(level);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(Number(limit));

  return db
    .prepare(
      `
      SELECT
        logs.id,
        logs.deployment_id,
        logs.vps_id,
        vps.name AS vps_name,
        logs.type,
        logs.level,
        logs.message,
        logs.created_at
      FROM logs
      LEFT JOIN vps ON vps.id = logs.vps_id
      ${whereClause}
      ORDER BY logs.created_at DESC
      LIMIT ?
      `,
    )
    .all(...params);
}
