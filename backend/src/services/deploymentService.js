import { getDatabase } from "../database/connection.js";

function now() {
  return new Date().toISOString();
}

export function createDeployment({ project_name, vps_id, target_path }) {
  const db = getDatabase();
  const createdAt = now();

  const result = db
    .prepare(
      `
      INSERT INTO deployments (
        project_name,
        vps_id,
        created_at,
        started_at,
        target_path,
        status,
        framework,
        build_command,
        output_folder
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      project_name,
      vps_id,
      createdAt,
      createdAt,
      target_path,
      "running",
      "react-vite",
      "npm run build",
      "dist",
    );

  return getDeploymentById(result.lastInsertRowid);
}

export function getDeploymentById(id) {
  const db = getDatabase();

  return db
    .prepare(
      `
      SELECT
        id,
        project_name,
        vps_id,
        created_at,
        started_at,
        finished_at,
        target_path,
        domain,
        status,
        framework,
        build_command,
        output_folder,
        duration_seconds
      FROM deployments
      WHERE id = ?
      `,
    )
    .get(id);
}

export function finishDeployment({ id, status, started_at }) {
  const db = getDatabase();

  const finishedAt = now();
  const durationSeconds = started_at
    ? Math.round((new Date(finishedAt) - new Date(started_at)) / 1000)
    : null;

  db.prepare(
    `
    UPDATE deployments
    SET
      status = ?,
      finished_at = ?,
      duration_seconds = ?
    WHERE id = ?
    `,
  ).run(status, finishedAt, durationSeconds, id);

  return getDeploymentById(id);
}
