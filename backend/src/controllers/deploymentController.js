import {
  getDeploymentDetailById,
  getDeployments,
} from "../services/deploymentService.js";
import { getLogs } from "../services/logService.js";

const allowedStatuses = ["pending", "running", "success", "failed"];

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function listDeploymentsController(req, res, next) {
  try {
    const { vps_id, status, project_name, limit } = req.query;

    if (vps_id && !parsePositiveInteger(vps_id)) {
      return res.status(400).json({
        status: "error",
        message: "El filtro vps_id no es válido.",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "El filtro status no es válido.",
      });
    }

    const parsedLimit = Number(limit || 100);
    const safeLimit =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 100;

    const deployments = getDeployments({
      vps_id,
      status,
      project_name,
      limit: safeLimit,
    });

    return res.json({
      status: "ok",
      data: deployments,
    });
  } catch (error) {
    return next(error);
  }
}

export function getDeploymentDetailController(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "El id del despliegue no es válido.",
      });
    }

    const deployment = getDeploymentDetailById(id);

    if (!deployment) {
      return res.status(404).json({
        status: "error",
        message: "Despliegue no encontrado.",
      });
    }

    const logs = getLogs({
      deployment_id: id,
      limit: 100,
    }).map(({ id: logId, type, level, message, created_at }) => ({
      id: logId,
      type,
      level,
      message,
      created_at,
    }));

    return res.json({
      status: "ok",
      data: {
        deployment,
        logs,
      },
    });
  } catch (error) {
    return next(error);
  }
}
