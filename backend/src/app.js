import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { initDatabase } from "./database/initDatabase.js";
import dbRoutes from "./routes/dbRoutes.js";
import vpsRoutes from "./routes/vpsRoutes.js";
import logsRoutes from "./routes/logsRoutes.js";

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

app.use((err, req, res, next) => {
  console.error("Error interno:", err.message);

  res.status(500).json({
    status: "error",
    message: "Error interno del servidor.",
  });
});

app.listen(env.backendPort, () => {
  console.log(
    `${env.appName} backend escuchando en el puerto ${env.backendPort}`,
  );
});
