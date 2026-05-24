import { useState } from "react";

export function NginxPanel({ vpsList, onConfigureNginx }) {
  const [vpsId, setVpsId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [domain, setDomain] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!vpsId) {
      setErrorMessage("Selecciona una VPS.");
      return;
    }

    if (!projectName.trim()) {
      setErrorMessage("Escribe el nombre del proyecto.");
      return;
    }

    if (!domain.trim()) {
      setErrorMessage("Escribe el dominio o IP.");
      return;
    }

    const sshPassword = window.prompt(
      "Introduce la contraseña SSH. No se guardará en VPSeccret.",
    );

    if (!sshPassword) {
      return;
    }

    const sudoPassword = window.prompt(
      "Introduce la contraseña sudo si es necesaria. Déjala vacía si sudo no pide contraseña.",
    );

    setIsConfiguring(true);
    setResult(null);
    setErrorMessage("");

    try {
      const response = await onConfigureNginx({
        vpsId,
        projectName,
        domain,
        sshPassword,
        sudoPassword: sudoPassword || "",
      });

      setResult(response.data);
    } catch (error) {
      setErrorMessage(error.data?.message || "No se pudo configurar Nginx.");
      setResult(error.data?.data || null);
    } finally {
      setIsConfiguring(false);
    }
  }

  return (
    <div className="card nginx-panel">
      <div className="section-header">
        <div>
          <h2>Configurar Nginx</h2>
          <p>
            Crea la configuración Nginx para servir el proyecto React/Vite desde
            /var/www/nombre-proyecto.
          </p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          VPS destino
          <select
            value={vpsId}
            onChange={(event) => setVpsId(event.target.value)}
          >
            <option value="">Selecciona una VPS</option>
            {vpsList.map((vps) => (
              <option key={vps.id} value={vps.id}>
                {vps.name} - {vps.ssh_user}@{vps.host}:{vps.ssh_port}
              </option>
            ))}
          </select>
        </label>

        <label>
          Nombre del proyecto
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="padel-front"
          />
        </label>

        <label>
          Dominio o IP
          <input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="149.202.61.198"
          />
        </label>

        <div className="warning-box">
          Esta acción modifica Nginx en la VPS, ejecuta nginx -t y recarga el
          servicio. No configura SSL todavía.
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" disabled={isConfiguring}>
          {isConfiguring ? "Configurando..." : "Configurar Nginx"}
        </button>
      </form>

      {result && (
        <div
          className={`precheck-result ${result.success ? "precheck-ok" : "precheck-error"}`}
        >
          <h3>
            {result.success ? "Nginx configurado" : "Configuración con errores"}
          </h3>

          {result.success ? (
            <ul>
              <li>Proyecto: {result.projectName}</li>
              <li>Dominio/IP: {result.serverName}</li>
              <li>Ruta raíz: {result.rootPath}</li>
              <li>Config: {result.availablePath}</li>
              <li>Activo en: {result.enabledPath}</li>
              <li>Usó sudo: {result.usedSudo ? "Sí" : "No"}</li>
            </ul>
          ) : (
            <>
              <p>{result.error || "No se pudo configurar Nginx."}</p>

              {result.stderr && (
                <pre className="build-error-output">{result.stderr}</pre>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
