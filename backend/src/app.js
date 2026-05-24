import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { initDatabase } from "./database/initDatabase.js";
import dbRoutes from "./routes/dbRoutes.js";
import vpsRoutes from "./routes/vpsRoutes.js";
import logsRoutes from "./routes/logsRoutes.js";
import precheckRoutes from "./routes/precheckRoutes.js";
import buildRoutes from "./routes/buildRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

initDatabase();

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: env.appName,
    message: "Backend funcionando correctamente",
  });
});

app.use("/api/db", dbRoutes);
app.use("/api/vps", vpsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/precheck", precheckRoutes);
app.use("/api/build", buildRoutes);

app.use((err, req, res, next) => {
  console.error("Error interno:", err.message);

  if (err.message === "Solo se permiten archivos ZIP.") {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      status: "error",
      message: "El archivo ZIP supera el tamaño máximo permitido.",
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Error interno del servidor.",
  });
});

app.listen(env.backendPort, () => {
  console.log(
    `${env.appName} backend escuchando en el puerto ${env.backendPort}`,
  );
});
