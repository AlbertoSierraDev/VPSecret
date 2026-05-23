import { Router } from "express";
import {
  listVpsController,
  getVpsController,
  createVpsController,
  updateVpsController,
  deleteVpsController,
  testVpsConnectionController,
} from "../controllers/vpsController.js";

const router = Router();

router.get("/", listVpsController);
router.post("/", createVpsController);
router.post("/:id/test-connection", testVpsConnectionController);
router.get("/:id", getVpsController);
router.put("/:id", updateVpsController);
router.delete("/:id", deleteVpsController);

export default router;
