import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { env } from "../config/env.js";
import { createLog } from "./logService.js";

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

function findPackageJson(startPath) {
  const items = fs.readdirSync(startPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(startPath, item.name);

    if (item.isFile() && item.name === "package.json") {
      return fullPath;
    }

    if (item.isDirectory()) {
      const ignoredFolders = ["node_modules", ".git", "dist", "build"];

      if (ignoredFolders.includes(item.name)) {
        continue;
      }

      const result = findPackageJson(fullPath);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function detectReactVite(packageJson) {
  const dependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  const hasReact = Boolean(dependencies.react);
  const hasVite = Boolean(dependencies.vite);

  return {
    isReactVite: hasReact && hasVite,
    hasReact,
    hasVite,
  };
}

function validateScripts(packageJson) {
  const scripts = packageJson.scripts || {};

  return {
    hasBuildScript: Boolean(scripts.build),
    buildCommand: scripts.build ? "npm run build" : null,
    scripts,
  };
}

export function runZipPrecheck({ zipPath, originalName }) {
  const precheckId = Date.now().toString();
  const extractPath = path.join(env.tempFolder, `precheck-${precheckId}`);

  createLog({
    type: "precheck",
    level: "info",
    message: `Iniciando pre-check del ZIP: ${originalName}`,
  });

  try {
    ensureFolderExists(env.tempFolder);
    ensureFolderExists(extractPath);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    createLog({
      type: "precheck",
      level: "info",
      message: "ZIP descomprimido correctamente para revisión.",
    });

    const packageJsonPath = findPackageJson(extractPath);

    if (!packageJsonPath) {
      createLog({
        type: "precheck",
        level: "error",
        message: "No se encontró package.json en el ZIP.",
      });

      return {
        success: false,
        projectType: "unknown",
        errors: ["No se encontró package.json en el ZIP."],
        warnings: [],
        details: {
          originalName,
        },
      };
    }

    const packageJson = readJsonFile(packageJsonPath);
    const framework = detectReactVite(packageJson);
    const scripts = validateScripts(packageJson);

    const errors = [];
    const warnings = [];

    if (!framework.hasReact) {
      errors.push("No se detectó React en dependencies o devDependencies.");
    }

    if (!framework.hasVite) {
      errors.push("No se detectó Vite en dependencies o devDependencies.");
    }

    if (!scripts.hasBuildScript) {
      errors.push("No se encontró script build en package.json.");
    }

    if (!packageJson.name) {
      warnings.push("El package.json no tiene campo name.");
    }

    const success = errors.length === 0;

    createLog({
      type: "precheck",
      level: success ? "success" : "error",
      message: success
        ? "Pre-check completado correctamente. Proyecto React/Vite válido."
        : "Pre-check completado con errores.",
    });

    return {
      success,
      projectType: framework.isReactVite ? "react-vite" : "unknown",
      errors,
      warnings,
      details: {
        originalName,
        packageName: packageJson.name || null,
        packageJsonPath: path.relative(extractPath, packageJsonPath),
        hasReact: framework.hasReact,
        hasVite: framework.hasVite,
        hasBuildScript: scripts.hasBuildScript,
        buildCommand: scripts.buildCommand,
        outputFolder: "dist",
      },
    };
  } catch (error) {
    createLog({
      type: "precheck",
      level: "error",
      message: "Error inesperado durante el pre-check del ZIP.",
    });

    return {
      success: false,
      projectType: "unknown",
      errors: ["Error inesperado durante el pre-check del ZIP."],
      warnings: [],
      details: {
        originalName,
      },
    };
  } finally {
    removeFolder(extractPath);

    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}
