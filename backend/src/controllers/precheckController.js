import { runZipPrecheck } from "../services/precheckService.js";

export function runPrecheckController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Debes subir un archivo ZIP.",
      });
    }

    const result = runZipPrecheck({
      zipPath: req.file.path,
      originalName: req.file.originalname,
    });

    return res.json({
      status: result.success ? "ok" : "error",
      message: result.success
        ? "Pre-check completado correctamente."
        : "El pre-check encontró errores.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}
