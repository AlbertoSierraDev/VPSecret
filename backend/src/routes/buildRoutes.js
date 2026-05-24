import { Router } from "express";
import { runBuildController } from "../controllers/buildController.js";
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

router.post("/", handleZipUpload, runBuildController);

export default router;
