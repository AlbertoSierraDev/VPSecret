import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";

function ensureFolderExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

ensureFolderExists(env.uploadsFolder);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.uploadsFolder);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

    cb(null, `${timestamp}-${safeOriginalName}`);
  },
});

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension !== ".zip") {
    return cb(new Error("Solo se permiten archivos ZIP."));
  }

  cb(null, true);
}

export const uploadZip = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024,
  },
});
