import { Router } from "express";
import { getDatabase } from "../database/connection.js";

const router = Router();

router.get("/health", (req, res) => {
  try {
    const db = getDatabase();

    const result = db.prepare("SELECT 1 AS ok").get();

    res.json({
      status: "ok",
      database: "connected",
      result,
      message: "SQLite funcionando correctamente",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: "Error al conectar con SQLite",
    });
  }
});

export default router;
