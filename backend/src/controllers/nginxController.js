import { env } from "../config/env.js";
import { getVpsById } from "../services/vpsService.js";
import { createLog } from "../services/logService.js";
import { configureNginxForStaticProject } from "../services/nginxService.js";

export async function configureNginxController(req, res, next) {
  try {
    const { vps_id, project_name, domain, ssh_password, sudo_password } =
      req.body;

    if (!vps_id) {
      return res.status(400).json({
        status: "error",
        message: "Debes seleccionar una VPS.",
      });
    }

    if (!project_name || typeof project_name !== "string") {
      return res.status(400).json({
        status: "error",
        message: "El nombre del proyecto es obligatorio.",
      });
    }

    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        status: "error",
        message: "El dominio o IP es obligatorio.",
      });
    }

    if (!ssh_password || typeof ssh_password !== "string") {
      return res.status(400).json({
        status: "error",
        message: "La contraseña SSH es obligatoria para configurar Nginx.",
      });
    }

    const vps = getVpsById(Number(vps_id));

    if (!vps) {
      return res.status(404).json({
        status: "error",
        message: "VPS no encontrada.",
      });
    }

    createLog({
      vps_id: vps.id,
      type: "nginx",
      level: "info",
      message: `Iniciando configuración Nginx para ${project_name}.`,
    });

    const result = await configureNginxForStaticProject({
      vps,
      sshPassword: ssh_password,
      sudoPassword: sudo_password,
      projectName: project_name,
      domain,
      basePath: env.defaultBasePath,
    });

    createLog({
      vps_id: vps.id,
      type: "nginx",
      level: "success",
      message: `Nginx configurado correctamente para ${result.serverName}.`,
    });

    return res.json({
      status: "ok",
      message: "Nginx configurado correctamente.",
      data: result,
    });
  } catch (error) {
    createLog({
      type: "nginx",
      level: "error",
      message: "Error configurando Nginx.",
    });

    return res.status(400).json({
      status: "error",
      message:
        "No se pudo configurar Nginx. Revisa permisos, Nginx instalado o ruta del proyecto.",
      data: {
        error: error.message,
      },
    });
  }
}
