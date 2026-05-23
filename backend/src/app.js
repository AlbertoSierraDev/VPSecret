import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { initDatabase } from "./database/initDatabase.js";
import dbRoutes from "./routes/dbRoutes.js";

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

app.listen(env.backendPort, () => {
  console.log(
    `${env.appName} backend escuchando en el puerto ${env.backendPort}`,
  );
});
