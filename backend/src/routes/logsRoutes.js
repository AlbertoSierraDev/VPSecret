import { Router } from "express";
import { listLogsController } from "../controllers/logsController.js";

const router = Router();

router.get("/", listLogsController);

export default router;
