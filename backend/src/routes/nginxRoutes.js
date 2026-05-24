import { Router } from "express";
import { configureNginxController } from "../controllers/nginxController.js";

const router = Router();

router.post("/configure", configureNginxController);

export default router;
