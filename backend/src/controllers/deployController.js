import { deployZipToVps } from "../services/deployService.js";

export async function runDeployController(req, res, next) {
  try {
    const { project_name, vps_id, ssh_password } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Debes subir un archivo ZIP.",
      });
    }

    if (!project_name || typeof project_name !== "string") {
      return res.status(400).json({
        status: "error",
        message: "El nombre del proyecto es obligatorio.",
      });
    }

    if (!vps_id) {
      return res.status(400).json({
        status: "error",
        message: "Debes seleccionar una VPS.",
      });
    }

    if (!ssh_password || typeof ssh_password !== "string") {
      return res.status(400).json({
        status: "error",
        message: "La contraseña SSH es obligatoria para desplegar.",
      });
    }

    const result = await deployZipToVps({
      zipPath: req.file.path,
      originalName: req.file.originalname,
      projectName: project_name,
      vpsId: Number(vps_id),
      sshPassword: ssh_password,
    });

    return res.status(result.success ? 200 : 400).json({
      status: result.success ? "ok" : "error",
      message: result.success
        ? "Despliegue básico completado correctamente."
        : "El despliegue básico encontró errores.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}
