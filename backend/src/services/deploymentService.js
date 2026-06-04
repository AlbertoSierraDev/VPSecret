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

export function getDeployments({
  vps_id,
  status,
  project_name,
  limit = 100,
} = {}) {
  const db = getDatabase();
  const conditions = [];
  const params = [];

  if (vps_id) {
    conditions.push("deployments.vps_id = ?");
    params.push(Number(vps_id));
  }

  if (status) {
    conditions.push("deployments.status = ?");
    params.push(status);
  }

  if (project_name) {
    conditions.push("deployments.project_name LIKE ?");
    params.push(`%${project_name}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(Number(limit));

  return db
    .prepare(
      `
      SELECT
        deployments.id,
        deployments.project_name,
        deployments.vps_id,
        vps.name AS vps_name,
        vps.host AS vps_host,
        deployments.created_at,
        deployments.started_at,
        deployments.finished_at,
        deployments.target_path,
        deployments.domain,
        deployments.status,
        deployments.framework,
        deployments.build_command,
        deployments.output_folder,
        deployments.duration_seconds
      FROM deployments
      LEFT JOIN vps ON vps.id = deployments.vps_id
      ${whereClause}
      ORDER BY deployments.created_at DESC
      LIMIT ?
      `,
    )
    .all(...params);
}

export function getDeploymentDetailById(id) {
  const db = getDatabase();

  return db
    .prepare(
      `
      SELECT
        deployments.id,
        deployments.project_name,
        deployments.vps_id,
        vps.name AS vps_name,
        vps.host AS vps_host,
        deployments.created_at,
        deployments.started_at,
        deployments.finished_at,
        deployments.target_path,
        deployments.domain,
        deployments.status,
        deployments.framework,
        deployments.build_command,
        deployments.output_folder,
        deployments.duration_seconds
      FROM deployments
      LEFT JOIN vps ON vps.id = deployments.vps_id
      WHERE deployments.id = ?
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
