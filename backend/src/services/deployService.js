import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { env } from "../config/env.js";
import { getVpsById } from "./vpsService.js";
import { createLog } from "./logService.js";
import { runCommand } from "./commandService.js";
import { uploadDistToVps } from "./sftpService.js";
import { createDeployment, finishDeployment } from "./deploymentService.js";

function ensureFolderExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

function removeFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
}

function sanitizeProjectName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function findPackageJson(startPath, depth = 0) {
  if (depth > 4) {
    return null;
  }

  const ignoredFolders = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".vite",
    ".cache",
    "coverage",
    ".turbo",
    ".output",
    "vendor",
  ];

  const items = fs.readdirSync(startPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(startPath, item.name);

    if (item.isFile() && item.name === "package.json") {
      return fullPath;
    }

    if (item.isDirectory()) {
      if (ignoredFolders.includes(item.name)) {
        continue;
      }

      const result = findPackageJson(fullPath, depth + 1);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function detectReactVite(packageJson) {
  const dependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  return {
    hasReact: Boolean(dependencies.react),
    hasVite: Boolean(dependencies.vite),
  };
}

export async function deployZipToVps({
  zipPath,
  originalName,
  projectName,
  vpsId,
  sshPassword,
}) {
  const safeProjectName = sanitizeProjectName(projectName);

  if (!safeProjectName) {
    return {
      success: false,
      errors: ["El nombre del proyecto no es válido."],
      details: {},
    };
  }

  const vps = getVpsById(vpsId);

  if (!vps) {
    return {
      success: false,
      errors: ["VPS no encontrada."],
      details: {},
    };
  }

  const deployId = Date.now().toString();
  const extractPath = path.join(env.tempFolder, `deploy-${deployId}`);
  const remoteTargetPath = `${env.defaultBasePath}/${safeProjectName}`;

  const deployment = createDeployment({
    project_name: safeProjectName,
    vps_id: vps.id,
    target_path: remoteTargetPath,
  });

  createLog({
    deployment_id: deployment.id,
    vps_id: vps.id,
    type: "deployment",
    level: "info",
    message: `Iniciando despliegue básico del ZIP: ${originalName}`,
  });

  try {
    ensureFolderExists(env.tempFolder);
    ensureFolderExists(extractPath);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "info",
      message: "ZIP descomprimido correctamente.",
    });

    const packageJsonPath = findPackageJson(extractPath);

    if (!packageJsonPath) {
      throw new Error("No se encontró package.json en el ZIP.");
    }

    const projectPath = path.dirname(packageJsonPath);
    const packageJson = readJsonFile(packageJsonPath);
    const framework = detectReactVite(packageJson);
    const scripts = packageJson.scripts || {};

    if (!framework.hasReact || !framework.hasVite) {
      throw new Error("El proyecto no parece ser React/Vite.");
    }

    if (!scripts.build) {
      throw new Error("No se encontró script build en package.json.");
    }

    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "info",
      message: "Instalando dependencias con npm install.",
    });

    await runCommand({
      command: "npm",
      args: ["install"],
      cwd: projectPath,
      timeoutMs: 180000,
    });

    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "success",
      message: "Dependencias instaladas correctamente.",
    });

    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "info",
      message: "Ejecutando npm run build.",
    });

    await runCommand({
      command: "npm",
      args: ["run", "build"],
      cwd: projectPath,
      timeoutMs: 180000,
    });

    const distPath = path.join(projectPath, "dist");

    if (!fs.existsSync(distPath)) {
      throw new Error("El build terminó, pero no se encontró la carpeta dist.");
    }

    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "success",
      message: "Build completado correctamente. Carpeta dist encontrada.",
    });

    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "info",
      message: `Subiendo dist a ${remoteTargetPath}.`,
    });

    await uploadDistToVps({
      vps,
      password: sshPassword,
      localDistPath: distPath,
      remoteTargetPath,
      onProgress: (message) => {
        createLog({
          deployment_id: deployment.id,
          vps_id: vps.id,
          type: "deployment",
          level: "info",
          message,
        });
      },
    });

    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "success",
      message: `Archivos subidos correctamente a ${remoteTargetPath}.`,
    });

    const finishedDeployment = finishDeployment({
      id: deployment.id,
      status: "success",
      started_at: deployment.started_at,
    });

    return {
      success: true,
      errors: [],
      details: {
        deployment: finishedDeployment,
        projectName: safeProjectName,
        targetPath: remoteTargetPath,
        packageName: packageJson.name || null,
        buildCommand: "npm run build",
        outputFolder: "dist",
      },
    };
  } catch (error) {
    createLog({
      deployment_id: deployment.id,
      vps_id: vps.id,
      type: "deployment",
      level: "error",
      message: "Error durante el despliegue básico.",
    });

    const failedDeployment = finishDeployment({
      id: deployment.id,
      status: "failed",
      started_at: deployment.started_at,
    });

    return {
      success: false,
      errors: [error.message || "Error durante el despliegue."],
      details: {
        deployment: failedDeployment,
        projectName: safeProjectName,
        targetPath: remoteTargetPath,
      },
    };
  } finally {
    removeFolder(extractPath);

    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}
