import { Router } from "express";
import {
  listVpsController,
  getVpsController,
  createVpsController,
  updateVpsController,
  deleteVpsController,
} from "../controllers/vpsController.js";

const router = Router();

router.get("/", listVpsController);
router.get("/:id", getVpsController);
router.post("/", createVpsController);
router.put("/:id", updateVpsController);
router.delete("/:id", deleteVpsController);

export default router;
