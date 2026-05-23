import {
  getAllVps,
  getVpsById,
  createVps,
  updateVps,
  deleteVps,
} from "../services/vpsService.js";

function isEmptyString(value) {
  return typeof value === "string" && value.trim() === "";
}

function validateVpsCreatePayload(data) {
  const errors = [];

  if (!data.name || typeof data.name !== "string" || isEmptyString(data.name)) {
    errors.push("El nombre de la VPS es obligatorio.");
  }

  if (!data.host || typeof data.host !== "string" || isEmptyString(data.host)) {
    errors.push("La IP o dominio de la VPS es obligatorio.");
  }

  if (
    !data.ssh_user ||
    typeof data.ssh_user !== "string" ||
    isEmptyString(data.ssh_user)
  ) {
    errors.push("El usuario SSH es obligatorio.");
  }

  if (data.ssh_port !== undefined && Number.isNaN(Number(data.ssh_port))) {
    errors.push("El puerto SSH debe ser un número.");
  }

  return errors;
}

function validateVpsUpdatePayload(data) {
  const errors = [];

  if (
    data.name !== undefined &&
    (typeof data.name !== "string" || isEmptyString(data.name))
  ) {
    errors.push("El nombre de la VPS no puede estar vacío.");
  }

  if (
    data.host !== undefined &&
    (typeof data.host !== "string" || isEmptyString(data.host))
  ) {
    errors.push("La IP o dominio de la VPS no puede estar vacía.");
  }

  if (
    data.ssh_user !== undefined &&
    (typeof data.ssh_user !== "string" || isEmptyString(data.ssh_user))
  ) {
    errors.push("El usuario SSH no puede estar vacío.");
  }

  if (data.ssh_port !== undefined && Number.isNaN(Number(data.ssh_port))) {
    errors.push("El puerto SSH debe ser un número.");
  }

  return errors;
}

function containsForbiddenSensitiveFields(data) {
  const forbiddenFields = [
    "password",
    "ssh_password",
    "sshPassword",
    "passphrase",
  ];

  return forbiddenFields.some((field) =>
    Object.prototype.hasOwnProperty.call(data, field),
  );
}

export function listVpsController(req, res, next) {
  try {
    const vpsList = getAllVps();

    res.json({
      status: "ok",
      data: vpsList,
    });
  } catch (error) {
    next(error);
  }
}

export function getVpsController(req, res, next) {
  try {
    const id = Number(req.params.id);

    const vps = getVpsById(id);

    if (!vps) {
      return res.status(404).json({
        status: "error",
        message: "VPS no encontrada.",
      });
    }

    return res.json({
      status: "ok",
      data: vps,
    });
  } catch (error) {
    return next(error);
  }
}

export function createVpsController(req, res, next) {
  try {
    const data = req.body;

    if (containsForbiddenSensitiveFields(data)) {
      return res.status(400).json({
        status: "error",
        message:
          "No está permitido guardar contraseñas SSH ni datos sensibles.",
      });
    }

    const errors = validateVpsCreatePayload(data);

    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        errors,
      });
    }

    const createdVps = createVps({
      name: data.name.trim(),
      host: data.host.trim(),
      ssh_port: Number(data.ssh_port || 22),
      ssh_user: data.ssh_user.trim(),
      notes: data.notes?.trim() || null,
    });

    return res.status(201).json({
      status: "ok",
      message: "VPS creada correctamente.",
      data: createdVps,
    });
  } catch (error) {
    return next(error);
  }
}

export function updateVpsController(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    if (containsForbiddenSensitiveFields(data)) {
      return res.status(400).json({
        status: "error",
        message:
          "No está permitido guardar contraseñas SSH ni datos sensibles.",
      });
    }

    const errors = validateVpsUpdatePayload(data);

    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        errors,
      });
    }

    const updatedVps = updateVps(id, {
      name: data.name !== undefined ? data.name.trim() : undefined,
      host: data.host !== undefined ? data.host.trim() : undefined,
      ssh_port: data.ssh_port !== undefined ? Number(data.ssh_port) : undefined,
      ssh_user: data.ssh_user !== undefined ? data.ssh_user.trim() : undefined,
      notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
      detected_os:
        data.detected_os !== undefined
          ? data.detected_os?.trim() || null
          : undefined,
      status:
        data.status !== undefined
          ? data.status?.trim() || "unknown"
          : undefined,
    });

    if (!updatedVps) {
      return res.status(404).json({
        status: "error",
        message: "VPS no encontrada.",
      });
    }

    return res.json({
      status: "ok",
      message: "VPS actualizada correctamente.",
      data: updatedVps,
    });
  } catch (error) {
    return next(error);
  }
}

export function deleteVpsController(req, res, next) {
  try {
    const id = Number(req.params.id);

    const deleted = deleteVps(id);

    if (!deleted) {
      return res.status(404).json({
        status: "error",
        message: "VPS no encontrada.",
      });
    }

    return res.json({
      status: "ok",
      message: "VPS eliminada correctamente.",
    });
  } catch (error) {
    return next(error);
  }
}
