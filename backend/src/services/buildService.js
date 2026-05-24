import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { env } from "../config/env.js";
import { createLog } from "./logService.js";
import { runCommand } from "./commandService.js";

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

function sanitizeCommandOutput(output) {
  if (!output) {
    return "";
  }

  return output
    .split("\n")
    .slice(-30)
    .join("\n")
    .replace(/password\s*[:=]\s*.+/gi, "password=[hidden]")
    .replace(/token\s*[:=]\s*.+/gi, "token=[hidden]")
    .replace(/npm_token\s*[:=]\s*.+/gi, "NPM_TOKEN=[hidden]")
    .replace(/_authToken\s*[:=]\s*.+/gi, "_authToken=[hidden]")
    .replace(
      /authorization\s*:\s*bearer\s+.+/gi,
      "Authorization: Bearer [hidden]",
    )
    .replace(/api[_-]?key\s*[:=]\s*.+/gi, "api_key=[hidden]")
    .replace(/secret\s*[:=]\s*.+/gi, "secret=[hidden]")
    .replace(/private key/gi, "[private key hidden]");
}

export async function runLocalBuild({ zipPath, originalName }) {
  const buildId = Date.now().toString();
  const extractPath = path.join(env.tempFolder, `build-${buildId}`);

  createLog({
    type: "deployment",
    level: "info",
    message: `Iniciando build local del ZIP: ${originalName}`,
  });

  try {
    ensureFolderExists(env.tempFolder);
    ensureFolderExists(extractPath);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    createLog({
      type: "deployment",
      level: "info",
      message: "ZIP descomprimido correctamente para build local.",
    });

    const packageJsonPath = findPackageJson(extractPath);

    if (!packageJsonPath) {
      createLog({
        type: "deployment",
        level: "error",
        message: "Build cancelado: no se encontró package.json.",
      });

      return {
        success: false,
        errors: ["No se encontró package.json en el ZIP."],
        warnings: [],
        details: {
          originalName,
        },
      };
    }

    const projectPath = path.dirname(packageJsonPath);
    const packageJson = readJsonFile(packageJsonPath);
    const framework = detectReactVite(packageJson);
    const scripts = packageJson.scripts || {};

    const errors = [];
    const warnings = [];

    if (!framework.hasReact) {
      errors.push("No se detectó React en dependencies o devDependencies.");
    }

    if (!framework.hasVite) {
      errors.push("No se detectó Vite en dependencies o devDependencies.");
    }

    if (!scripts.build) {
      errors.push("No se encontró script build en package.json.");
    }

    if (errors.length > 0) {
      createLog({
        type: "deployment",
        level: "error",
        message:
          "Build cancelado: el proyecto no supera la validación React/Vite.",
      });

      return {
        success: false,
        errors,
        warnings,
        details: {
          originalName,
          packageName: packageJson.name || null,
          packageJsonPath: path.relative(extractPath, packageJsonPath),
        },
      };
    }

    createLog({
      type: "deployment",
      level: "info",
      message: "Instalando dependencias del proyecto con npm install.",
    });

    await runCommand({
      command: "npm",
      args: ["install"],
      cwd: projectPath,
      timeoutMs: 180000,
    });

    createLog({
      type: "deployment",
      level: "success",
      message: "Dependencias instaladas correctamente.",
    });

    createLog({
      type: "deployment",
      level: "info",
      message: "Ejecutando build local con npm run build.",
    });

    await runCommand({
      command: "npm",
      args: ["run", "build"],
      cwd: projectPath,
      timeoutMs: 180000,
    });

    const distPath = path.join(projectPath, "dist");

    if (!fs.existsSync(distPath)) {
      createLog({
        type: "deployment",
        level: "error",
        message: "Build ejecutado, pero no se encontró carpeta dist.",
      });

      return {
        success: false,
        errors: ["El build terminó, pero no se encontró la carpeta dist."],
        warnings,
        details: {
          originalName,
          packageName: packageJson.name || null,
          outputFolder: "dist",
        },
      };
    }

    createLog({
      type: "deployment",
      level: "success",
      message: "Build local completado correctamente. Carpeta dist encontrada.",
    });

    return {
      success: true,
      errors: [],
      warnings,
      details: {
        originalName,
        packageName: packageJson.name || null,
        projectType: "react-vite",
        buildCommand: "npm run build",
        outputFolder: "dist",
        packageJsonPath: path.relative(extractPath, packageJsonPath),
      },
    };
  } catch (error) {
    createLog({
      type: "deployment",
      level: "error",
      message: "Error durante el build local del proyecto.",
    });

    return {
      success: false,
      errors: ["Error durante el build local del proyecto."],
      warnings: [],
      details: {
        originalName,
        error: sanitizeCommandOutput(error.stderr || error.message),
      },
    };
  } finally {
    removeFolder(extractPath);

    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}
