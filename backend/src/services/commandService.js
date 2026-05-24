import { spawn } from "child_process";

export function runCommand({ command, args = [], cwd, timeoutMs = 120000 }) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let finished = false;

    const child = spawn(command, args, {
      cwd,
      shell: process.platform === "win32",
    });

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        child.kill("SIGTERM");

        reject(
          new Error(
            `Tiempo máximo superado ejecutando: ${command} ${args.join(" ")}`,
          ),
        );
      }
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);

      if (!finished) {
        finished = true;
        reject(error);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (finished) {
        return;
      }

      finished = true;

      if (code !== 0) {
        const error = new Error(
          `El comando terminó con código ${code}: ${command} ${args.join(" ")}`,
        );
        error.stdout = stdout;
        error.stderr = stderr;
        error.code = code;
        return reject(error);
      }

      return resolve({
        code,
        stdout,
        stderr,
      });
    });
  });
}
