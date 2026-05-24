import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/src/config -> subir 3 niveles hasta la raíz del proyecto
const projectRoot = path.resolve(__dirname, "../../..");

function resolveProjectPath(value, fallback) {
  const selectedValue = value || fallback;

  if (path.isAbsolute(selectedValue)) {
    return selectedValue;
  }

  return path.resolve(projectRoot, selectedValue);
}

export const env = {
  appName: process.env.APP_NAME || "VPSeccret",
  backendPort: Number(process.env.BACKEND_PORT || 3000),

  databasePath: resolveProjectPath(
    process.env.DATABASE_PATH,
    "./database/vpseccret.sqlite",
  ),

  defaultSshPort: Number(process.env.DEFAULT_SSH_PORT || 22),
  defaultBasePath: process.env.DEFAULT_BASE_PATH || "/var/www",
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB || 100),

  tempFolder: resolveProjectPath(process.env.TEMP_FOLDER, "./temp"),
  uploadsFolder: resolveProjectPath(process.env.UPLOADS_FOLDER, "./uploads"),
};
