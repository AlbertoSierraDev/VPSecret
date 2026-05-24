import { Client } from "ssh2";

function connectSsh({ host, port, username, password }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on("ready", () => resolve(conn))
      .on("error", reject)
      .connect({
        host,
        port,
        username,
        password,
        readyTimeout: 15000,
      });
  });
}

function execCommand(
  conn,
  command,
  friendlyErrorMessage = "Error ejecutando comando remoto",
) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (error, stream) => {
      if (error) {
        return reject(error);
      }

      let stdout = "";
      let stderr = "";

      stream
        .on("close", (code) => {
          if (code !== 0) {
            const commandError = new Error(friendlyErrorMessage);
            commandError.stdout = stdout;
            commandError.stderr = stderr;
            commandError.code = code;
            commandError.command = command;
            return reject(commandError);
          }

          return resolve({
            stdout,
            stderr,
          });
        })
        .on("data", (data) => {
          stdout += data.toString();
        });

      stream.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    });
  });
}

function sanitizeProjectName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeServerName(domain) {
  return domain.trim().replace(/[^a-zA-Z0-9._-]/g, "");
}

function buildNginxConfig({ serverName, rootPath }) {
  return `
server {
    listen 80;
    server_name ${serverName};

    root ${rootPath};
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/vpseccret-${serverName}-access.log;
    error_log /var/log/nginx/vpseccret-${serverName}-error.log;
}
`.trim();
}

function escapeSingleQuotes(value) {
  return String(value).replace(/'/g, "'\\''");
}

function buildSudoCommand(command, sudoPassword) {
  if (!sudoPassword || sudoPassword.trim() === "") {
    return `sudo -n ${command}`;
  }

  const escapedPassword = escapeSingleQuotes(sudoPassword);

  return `printf '%s\n' '${escapedPassword}' | sudo -S -p '' ${command}`;
}

function isPermissionError(error) {
  const text =
    `${error.message || ""}\n${error.stderr || ""}\n${error.stdout || ""}`.toLowerCase();

  return (
    text.includes("permission denied") ||
    text.includes("permiso denegado") ||
    text.includes("operation not permitted") ||
    text.includes("not in the sudoers") ||
    text.includes("a password is required") ||
    text.includes("password is required") ||
    text.includes("authentication is required") ||
    text.includes("interactive authentication required") ||
    text.includes("access denied") ||
    text.includes("polkit") ||
    text.includes("sudo:")
  );
}

async function execDirectOrSudo({
  conn,
  directCommand,
  sudoCommand,
  sudoPassword,
  directErrorMessage,
  sudoErrorMessage,
  onUseSudo,
}) {
  try {
    return await execCommand(conn, directCommand, directErrorMessage);
  } catch (error) {
    if (!isPermissionError(error)) {
      throw error;
    }

    onUseSudo?.();

    return execCommand(
      conn,
      buildSudoCommand(sudoCommand || directCommand, sudoPassword),
      sudoErrorMessage || directErrorMessage,
    );
  }
}

export async function configureNginxForStaticProject({
  vps,
  sshPassword,
  sudoPassword,
  projectName,
  domain,
  basePath,
}) {
  const safeProjectName = sanitizeProjectName(projectName);
  const serverName = sanitizeServerName(domain);
  const rootPath = `${basePath}/${safeProjectName}`;

  if (!safeProjectName) {
    throw new Error("El nombre del proyecto no es válido.");
  }

  if (!serverName) {
    throw new Error("El dominio o IP no es válido.");
  }

  const config = buildNginxConfig({
    serverName,
    rootPath,
  });

  const availablePath = `/etc/nginx/sites-available/${safeProjectName}`;
  const enabledPath = `/etc/nginx/sites-enabled/${safeProjectName}`;
  const tempConfigPath = `/tmp/vpseccret-${safeProjectName}.conf`;

  const conn = await connectSsh({
    host: vps.host,
    port: vps.ssh_port,
    username: vps.ssh_user,
    password: sshPassword,
  });

  let usedSudo = false;

  try {
    await execCommand(
      conn,
      `test -d "${rootPath}"`,
      `No existe la carpeta del proyecto: ${rootPath}`,
    );

    await execCommand(
      conn,
      `test -f "${rootPath}/index.html"`,
      `No existe index.html en: ${rootPath}`,
    );

    await execCommand(
      conn,
      `printf '%s' '${escapeSingleQuotes(config)}' > "${tempConfigPath}"`,
      `No se pudo crear la configuración temporal Nginx en: ${tempConfigPath}`,
    );

    await execDirectOrSudo({
      conn,
      directCommand: `mv "${tempConfigPath}" "${availablePath}"`,
      sudoCommand: `mv "${tempConfigPath}" "${availablePath}"`,
      sudoPassword,
      directErrorMessage: `No se pudo mover la configuración Nginx a: ${availablePath}`,
      sudoErrorMessage: `No se pudo mover la configuración Nginx con sudo a: ${availablePath}`,
      onUseSudo: () => {
        usedSudo = true;
      },
    });

    await execDirectOrSudo({
      conn,
      directCommand: `ln -sfn "${availablePath}" "${enabledPath}"`,
      sudoCommand: `ln -sfn "${availablePath}" "${enabledPath}"`,
      sudoPassword,
      directErrorMessage: `No se pudo activar el sitio Nginx: ${enabledPath}`,
      sudoErrorMessage: `No se pudo activar el sitio Nginx con sudo: ${enabledPath}`,
      onUseSudo: () => {
        usedSudo = true;
      },
    });

    await execDirectOrSudo({
      conn,
      directCommand: "/usr/sbin/nginx -t",
      sudoCommand: "/usr/sbin/nginx -t",
      sudoPassword,
      directErrorMessage: "La configuración de Nginx no es válida",
      sudoErrorMessage:
        "La configuración de Nginx no es válida al probar con sudo",
      onUseSudo: () => {
        usedSudo = true;
      },
    });

    await execDirectOrSudo({
      conn,
      directCommand: "/usr/bin/systemctl reload nginx",
      sudoCommand: "/usr/bin/systemctl reload nginx",
      sudoPassword,
      directErrorMessage: "No se pudo recargar Nginx con systemctl",
      sudoErrorMessage: "No se pudo recargar Nginx con sudo systemctl",
      onUseSudo: () => {
        usedSudo = true;
      },
    });

    return {
      success: true,
      projectName: safeProjectName,
      serverName,
      rootPath,
      availablePath,
      enabledPath,
      usedSudo,
    };
  } finally {
    conn.end();
  }
}
