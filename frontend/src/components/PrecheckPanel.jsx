import { useState } from "react";

export function PrecheckPanel({ onRunPrecheck }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
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
      setErrorMessage(
        "Selecciona un archivo ZIP antes de ejecutar el pre-check.",
      );
      return;
    }

    setIsChecking(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await onRunPrecheck(selectedFile);
      setResult(response.data);
    } catch (error) {
      setErrorMessage(
        error.data?.message || "No se pudo ejecutar el pre-check.",
      );
      setResult(error.data?.data || null);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="card precheck-panel">
      <div className="section-header">
        <div>
          <h2>Pre-check de proyecto ZIP</h2>
          <p>
            Valida si el ZIP parece un proyecto React/Vite antes de desplegar.
          </p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Archivo ZIP del proyecto
          <input type="file" accept=".zip" onChange={handleFileChange} />
        </label>

        <div className="warning-box">
          El ZIP se usa solo temporalmente para validar el proyecto y después se
          elimina.
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" disabled={isChecking}>
          {isChecking ? "Revisando..." : "Ejecutar pre-check"}
        </button>
      </form>

      {result && (
        <div
          className={`precheck-result ${result.success ? "precheck-ok" : "precheck-error"}`}
        >
          <h3>{result.success ? "Proyecto válido" : "Proyecto con errores"}</h3>

          <p>
            Tipo detectado: <strong>{result.projectType}</strong>
          </p>

          {result.details && (
            <ul>
              <li>React detectado: {result.details.hasReact ? "Sí" : "No"}</li>
              <li>Vite detectado: {result.details.hasVite ? "Sí" : "No"}</li>
              <li>
                Script build: {result.details.hasBuildScript ? "Sí" : "No"}
              </li>
              <li>
                Comando build: {result.details.buildCommand || "No disponible"}
              </li>
              <li>Carpeta esperada: {result.details.outputFolder || "dist"}</li>
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

          {result.warnings?.length > 0 && (
            <>
              <h4>Advertencias</h4>
              <ul>
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
