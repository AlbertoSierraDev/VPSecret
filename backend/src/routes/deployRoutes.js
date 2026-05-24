import { Router } from "express";
import { runDeployController } from "../controllers/deployController.js";
import { uploadZip } from "../middlewares/uploadMiddleware.js";

const router = Router();

function handleZipUpload(req, res, next) {
  uploadZip.single("project_zip")(req, res, (error) => {
    if (error) {
      return next(error);
    }

    return next();
  });
}

router.post("/", handleZipUpload, runDeployController);

export default router;
