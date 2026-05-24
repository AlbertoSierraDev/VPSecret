import { Router } from "express";
import { runPrecheckController } from "../controllers/precheckController.js";
import { uploadZip } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.post("/", uploadZip.single("project_zip"), runPrecheckController);

export default router;
