import fs from "fs";
import path from "path";
import { Client } from "ssh2";

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

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

function execCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (error, stream) => {
      if (error) {
        return reject(error);
      }

      let stderr = "";

      stream
        .on("close", (code) => {
          if (code !== 0) {
            return reject(
              new Error(stderr || `Comando falló con código ${code}`),
            );
          }

          return resolve();
        })
        .on("data", () => {});

      stream.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    });
  });
}

function openSftp(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((error, sftp) => {
      if (error) {
        return reject(error);
      }

      return resolve(sftp);
    });
  });
}

function sftpMkdir(sftp, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.mkdir(remotePath, (error) => {
      if (!error || error.code === 4) {
        return resolve();
      }

      return reject(error);
    });
  });
}

function sftpFastPut(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

async function uploadDirectoryRecursive(sftp, localDir, remoteDir, onProgress) {
  await withTimeout(
    sftpMkdir(sftp, remoteDir),
    15000,
    `Timeout creando carpeta remota: ${remoteDir}`,
  );

  const items = fs.readdirSync(localDir, { withFileTypes: true });

  for (const item of items) {
    const localPath = path.join(localDir, item.name);
    const remotePath = `${remoteDir}/${item.name}`;

    if (item.isDirectory()) {
      await uploadDirectoryRecursive(sftp, localPath, remotePath, onProgress);
    } else if (item.isFile()) {
      onProgress?.(`Subiendo archivo: ${remotePath}`);

      await withTimeout(
        sftpFastPut(sftp, localPath, remotePath),
        30000,
        `Timeout subiendo archivo: ${remotePath}`,
      );
    }
  }
}

export async function uploadDistToVps({
  vps,
  password,
  localDistPath,
  remoteTargetPath,
  onProgress,
}) {
  onProgress?.("Conectando por SSH para subida SFTP.");

  const conn = await withTimeout(
    connectSsh({
      host: vps.host,
      port: vps.ssh_port,
      username: vps.ssh_user,
      password,
    }),
    20000,
    "Timeout conectando por SSH para subir archivos.",
  );

  try {
    onProgress?.("Preparando carpeta remota.");

    await withTimeout(
      execCommand(
        conn,
        `mkdir -p "${remoteTargetPath}" && rm -rf "${remoteTargetPath}"/* && chmod 775 "${remoteTargetPath}"`,
      ),
      20000,
      "Timeout preparando carpeta remota.",
    );

    onProgress?.("Abriendo sesión SFTP.");

    const sftp = await withTimeout(
      openSftp(conn),
      20000,
      "Timeout abriendo sesión SFTP.",
    );

    onProgress?.("Sesión SFTP abierta. Iniciando subida de archivos.");

    await uploadDirectoryRecursive(
      sftp,
      localDistPath,
      remoteTargetPath,
      onProgress,
    );

    onProgress?.("Subida SFTP completada.");

    return {
      success: true,
      remoteTargetPath,
    };
  } finally {
    conn.end();
  }
}
