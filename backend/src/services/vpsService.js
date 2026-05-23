import { getDatabase } from "../database/connection.js";

function getCurrentDateTime() {
  return new Date().toISOString();
}

export function getAllVps() {
  const db = getDatabase();

  return db
    .prepare(
      `
      SELECT
        id,
        name,
        host,
        ssh_port,
        ssh_user,
        detected_os,
        notes,
        status,
        created_at,
        updated_at,
        last_successful_connection_at
      FROM vps
      ORDER BY created_at DESC
      `,
    )
    .all();
}

export function getVpsById(id) {
  const db = getDatabase();

  return db
    .prepare(
      `
      SELECT
        id,
        name,
        host,
        ssh_port,
        ssh_user,
        detected_os,
        notes,
        status,
        created_at,
        updated_at,
        last_successful_connection_at
      FROM vps
      WHERE id = ?
      `,
    )
    .get(id);
}

export function createVps(data) {
  const db = getDatabase();

  const now = getCurrentDateTime();

  const stmt = db.prepare(
    `
    INSERT INTO vps (
      name,
      host,
      ssh_port,
      ssh_user,
      detected_os,
      notes,
      status,
      created_at,
      updated_at,
      last_successful_connection_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  );

  const result = stmt.run(
    data.name,
    data.host,
    data.ssh_port || 22,
    data.ssh_user,
    data.detected_os || null,
    data.notes || null,
    data.status || "unknown",
    now,
    now,
    null,
  );

  return getVpsById(result.lastInsertRowid);
}

export function updateVps(id, data) {
  const db = getDatabase();

  const existingVps = getVpsById(id);

  if (!existingVps) {
    return null;
  }

  const now = getCurrentDateTime();

  db.prepare(
    `
    UPDATE vps
    SET
      name = ?,
      host = ?,
      ssh_port = ?,
      ssh_user = ?,
      detected_os = ?,
      notes = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
    `,
  ).run(
    data.name ?? existingVps.name,
    data.host ?? existingVps.host,
    data.ssh_port ?? existingVps.ssh_port,
    data.ssh_user ?? existingVps.ssh_user,
    data.detected_os ?? existingVps.detected_os,
    data.notes ?? existingVps.notes,
    data.status ?? existingVps.status,
    now,
    id,
  );

  return getVpsById(id);
}

export function deleteVps(id) {
  const db = getDatabase();

  const existingVps = getVpsById(id);

  if (!existingVps) {
    return false;
  }

  db.prepare("DELETE FROM vps WHERE id = ?").run(id);

  return true;
}
