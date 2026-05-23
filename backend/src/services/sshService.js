import { Client } from "ssh2";

export function testSshConnection({ host, port, username, password }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        conn.end();
        reject(new Error("Tiempo de conexión SSH agotado."));
      }
    }, 15000);

    conn
      .on("ready", () => {
        conn.exec("uname -a || cat /etc/os-release", (error, stream) => {
          if (error) {
            clearTimeout(timeout);

            if (!settled) {
              settled = true;
              conn.end();
              reject(error);
            }

            return;
          }

          let output = "";
          let errorOutput = "";

          stream
            .on("close", () => {
              clearTimeout(timeout);

              if (!settled) {
                settled = true;
                conn.end();

                resolve({
                  success: true,
                  detectedOs: output.trim() || "Sistema no detectado",
                  errorOutput: errorOutput.trim(),
                });
              }
            })
            .on("data", (data) => {
              output += data.toString();
            });

          stream.stderr.on("data", (data) => {
            errorOutput += data.toString();
          });
        });
      })
      .on("error", (error) => {
        clearTimeout(timeout);

        if (!settled) {
          settled = true;
          reject(error);
        }
      })
      .connect({
        host,
        port,
        username,
        password,
        readyTimeout: 15000,
      });
  });
}
