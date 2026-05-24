import { useState } from "react";

export function DeployPanel({ vpsList, onRunDeploy }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [vpsId, setVpsId] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function handleFileChange(event) {
    setSelectedFile(event.target.files?.[0] || null);
    setResult(null);
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Selecciona un archivo ZIP antes de desplegar.");
      return;
    }

    if (!projectName.trim()) {
      setErrorMessage("Escribe un nombre de proyecto.");
      return;
    }

    if (!vpsId) {
      setErrorMessage("Selecciona una VPS.");
      return;
    }

    const sshPassword = window.prompt(
      "Introduce la contraseña SSH. No se guardará en VPSeccret.",
    );

    if (!sshPassword) {
      return;
    }

    setIsDeploying(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await onRunDeploy({
        file: selectedFile,
        projectName,
        vpsId,
        sshPassword,
      });

      setResult(response.data);
    } catch (error) {
      setErrorMessage(
        error.data?.message || "No se pudo ejecutar el despliegue.",
      );
      setResult(error.data?.data || null);
    } finally {
      setIsDeploying(false);
    }
  }

  return (
    <div className="card deploy-panel">
      <div className="section-header">
        <div>
          <h2>Despliegue básico</h2>
          <p>
            Construye el ZIP y sube la carpeta dist a /var/www/nombre-proyecto.
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
          ZIP del proyecto
          <input type="file" accept=".zip" onChange={handleFileChange} />
        </label>

        <div className="warning-box">
          La contraseña SSH se pedirá solo al desplegar. No se guarda en
          VPSeccret. Este despliegue todavía no configura Nginx ni SSL.
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" disabled={isDeploying}>
          {isDeploying ? "Desplegando..." : "Ejecutar despliegue básico"}
        </button>
      </form>

      {result && (
        <div
          className={`precheck-result ${result.success ? "precheck-ok" : "precheck-error"}`}
        >
          <h3>
            {result.success
              ? "Despliegue completado"
              : "Despliegue con errores"}
          </h3>

          {result.details && (
            <ul>
              <li>Proyecto: {result.details.projectName || "No disponible"}</li>
              <li>
                Ruta destino: {result.details.targetPath || "No disponible"}
              </li>
              <li>Build: {result.details.buildCommand || "No disponible"}</li>
              <li>Salida: {result.details.outputFolder || "dist"}</li>
              {result.details.deployment?.duration_seconds !== undefined && (
                <li>Duración: {result.details.deployment.duration_seconds}s</li>
              )}
            </ul>
          )}

          {result.errors?.length > 0 && (
            <>
              <h4>Errores</h4>
              <ul>
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
