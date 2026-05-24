import { useState } from "react";

export function BuildPanel({ onRunBuild }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
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
      setErrorMessage("Selecciona un archivo ZIP antes de ejecutar el build.");
      return;
    }

    setIsBuilding(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await onRunBuild(selectedFile);
      setResult(response.data);
    } catch (error) {
      setErrorMessage(
        error.data?.message || "No se pudo ejecutar el build local.",
      );
      setResult(error.data?.data || null);
    } finally {
      setIsBuilding(false);
    }
  }

  return (
    <div className="card build-panel">
      <div className="section-header">
        <div>
          <h2>Build local del proyecto</h2>
          <p>
            Instala dependencias, ejecuta npm run build y comprueba la carpeta
            dist.
          </p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Archivo ZIP del proyecto
          <input type="file" accept=".zip" onChange={handleFileChange} />
        </label>

        <div className="warning-box">
          El build se ejecuta localmente en el entorno de VPSeccret. Todavía no
          se sube nada a la VPS.
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" disabled={isBuilding}>
          {isBuilding ? "Construyendo..." : "Ejecutar build local"}
        </button>
      </form>

      {result && (
        <div
          className={`precheck-result ${result.success ? "precheck-ok" : "precheck-error"}`}
        >
          <h3>{result.success ? "Build completado" : "Build con errores"}</h3>

          {result.details && (
            <ul>
              <li>Proyecto: {result.details.packageName || "No disponible"}</li>
              <li>Tipo: {result.details.projectType || "No disponible"}</li>
              <li>Comando: {result.details.buildCommand || "No disponible"}</li>
              <li>Carpeta generada: {result.details.outputFolder || "dist"}</li>
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

          {result.details?.error && (
            <pre className="build-error-output">{result.details.error}</pre>
          )}
        </div>
      )}
    </div>
  );
}
