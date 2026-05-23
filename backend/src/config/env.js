import dotenv from "dotenv";

dotenv.config();

export const env = {
  appName: process.env.APP_NAME || "VPSeccret",
  backendPort: Number(process.env.BACKEND_PORT || 3000),
  databasePath: process.env.DATABASE_PATH || "./database/vpseccret.sqlite",
  defaultSshPort: Number(process.env.DEFAULT_SSH_PORT || 22),
  defaultBasePath: process.env.DEFAULT_BASE_PATH || "/var/www",
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB || 100),
  tempFolder: process.env.TEMP_FOLDER || "./temp",
  uploadsFolder: process.env.UPLOADS_FOLDER || "./uploads",
};
