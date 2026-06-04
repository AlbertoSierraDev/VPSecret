import { Router } from "express";
import {
  getDeploymentDetailController,
  listDeploymentsController,
} from "../controllers/deploymentController.js";

const router = Router();

router.get("/", listDeploymentsController);
router.get("/:id", getDeploymentDetailController);

export default router;
