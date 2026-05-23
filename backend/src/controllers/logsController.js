import { getLogs } from "../services/logService.js";

const allowedTypes = [
  "ssh_connection",
  "deployment",
  "nginx",
  "system_error",
  "precheck",
];
const allowedLevels = ["info", "success", "warning", "error"];

export function listLogsController(req, res, next) {
  try {
    const { vps_id, deployment_id, type, level, limit } = req.query;

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        status: "error",
        message: "Tipo de log no válido.",
      });
    }

    if (level && !allowedLevels.includes(level)) {
      return res.status(400).json({
        status: "error",
        message: "Nivel de log no válido.",
      });
    }

    const safeLimit = Math.min(Number(limit || 100), 200);

    const logs = getLogs({
      vps_id,
      deployment_id,
      type,
      level,
      limit: safeLimit,
    });

    return res.json({
      status: "ok",
      data: logs,
    });
  } catch (error) {
    return next(error);
  }
}
