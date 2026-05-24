import { runLocalBuild } from "../services/buildService.js";

export async function runBuildController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Debes subir un archivo ZIP.",
      });
    }

    const result = await runLocalBuild({
      zipPath: req.file.path,
      originalName: req.file.originalname,
    });

    return res.status(result.success ? 200 : 400).json({
      status: result.success ? "ok" : "error",
      message: result.success
        ? "Build local completado correctamente."
        : "El build local encontró errores.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}
