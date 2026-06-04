import { useEffect, useState } from "react";
import {
  getDeploymentDetail,
  getDeployments,
} from "../services/vpsApi.js";

function formatDate(value) {
  if (!value) {
    return "No disponible";
  }

  return new Date(value).toLocaleString();
}

function formatDuration(value) {
  if (value === null || value === undefined) {
    return "No disponible";
  }

  return `${value}s`;
}

function getStatusLabel(status) {
  const labels = {
    pending: "Pendiente",
    running: "En curso",
    success: "Correcto",
    failed: "Error",
  };

  return labels[status] || status || "Desconocido";
}

export function DeploymentsHistoryPanel({ refreshKey = 0 }) {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(null);
  const [deploymentDetail, setDeploymentDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [detailErrorMessage, setDetailErrorMessage] = useState("");

  async function loadDeployments() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getDeployments({ limit: 100 });
      setDeployments(response.data || []);
    } catch (error) {
      setErrorMessage(
        error.data?.message || "No se pudo cargar el historial.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectDeployment(id) {
    setSelectedDeploymentId(id);
    setDeploymentDetail(null);
    setDetailErrorMessage("");
    setIsLoadingDetail(true);

    try {
      const response = await getDeploymentDetail(id);
      setDeploymentDetail(response.data || null);
    } catch (error) {
      setDetailErrorMessage(
        error.data?.message || "No se pudo cargar el detalle del despliegue.",
      );
    } finally {
      setIsLoadingDetail(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadDeployments();
    });
  }, [refreshKey]);

  return (
    <div className="section-stack">
      <div className="card history-panel">
        <div className="section-header">
          <div>
            <h2>Historial de despliegues</h2>
            <p>Despliegues reales guardados en SQLite.</p>
          </div>

          <button type="button" onClick={loadDeployments} disabled={isLoading}>
            {isLoading ? "Cargando..." : "Actualizar historial"}
          </button>
        </div>

        <div className="warning-box">
          La actualización de página desde historial se implementará en el
          siguiente paso del MVP.
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {isLoading ? (
          <div className="empty-state small-empty">
            <p>Cargando historial...</p>
          </div>
        ) : deployments.length === 0 ? (
          <div className="empty-state small-empty">
            <h3>No hay despliegues todavía</h3>
            <p>Cuando ejecutes un despliegue aparecerá aquí.</p>
          </div>
        ) : (
          <div className="history-list">
            {deployments.map((deployment) => (
              <article
                className="history-item"
                key={deployment.id}
                aria-current={
                  selectedDeploymentId === deployment.id ? "true" : undefined
                }
              >
                <div className="history-main">
                  <div className="history-title-row">
                    <h3>{deployment.project_name}</h3>
                    <span className={`status status-${deployment.status}`}>
                      {getStatusLabel(deployment.status)}
                    </span>
                  </div>

                  <dl className="history-meta">
                    <div>
                      <dt>VPS</dt>
                      <dd>{deployment.vps_name || "No disponible"}</dd>
                    </div>
                    <div>
                      <dt>Host</dt>
                      <dd>{deployment.vps_host || "No disponible"}</dd>
                    </div>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{formatDate(deployment.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Duración</dt>
                      <dd>{formatDuration(deployment.duration_seconds)}</dd>
                    </div>
                    <div>
                      <dt>Ruta destino</dt>
                      <dd>{deployment.target_path || "No disponible"}</dd>
                    </div>
                    <div>
                      <dt>Dominio/IP</dt>
                      <dd>{deployment.domain || "No disponible"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="history-actions">
                  <button
                    type="button"
                    onClick={() => handleSelectDeployment(deployment.id)}
                  >
                    Ver detalle
                  </button>
                  <button type="button" disabled>
                    Actualizar página próximamente
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedDeploymentId && (
        <div className="card history-detail-panel">
          <div className="section-header">
            <div>
              <h2>Detalle del despliegue</h2>
              <p>Datos y logs asociados al despliegue seleccionado.</p>
            </div>
          </div>

          {isLoadingDetail && <p>Cargando detalle...</p>}
          {detailErrorMessage && (
            <p className="error-message">{detailErrorMessage}</p>
          )}

          {deploymentDetail && (
            <>
              <div className="detail-grid">
                <div>
                  <span>Proyecto</span>
                  <strong>{deploymentDetail.deployment.project_name}</strong>
                </div>
                <div>
                  <span>VPS</span>
                  <strong>
                    {deploymentDetail.deployment.vps_name || "No disponible"}
                  </strong>
                </div>
                <div>
                  <span>Host</span>
                  <strong>
                    {deploymentDetail.deployment.vps_host || "No disponible"}
                  </strong>
                </div>
                <div>
                  <span>Estado</span>
                  <strong>
                    {getStatusLabel(deploymentDetail.deployment.status)}
                  </strong>
                </div>
                <div>
                  <span>Fecha inicio</span>
                  <strong>
                    {formatDate(deploymentDetail.deployment.started_at)}
                  </strong>
                </div>
                <div>
                  <span>Fecha fin</span>
                  <strong>
                    {formatDate(deploymentDetail.deployment.finished_at)}
                  </strong>
                </div>
                <div>
                  <span>Duración</span>
                  <strong>
                    {formatDuration(
                      deploymentDetail.deployment.duration_seconds,
                    )}
                  </strong>
                </div>
                <div>
                  <span>Ruta destino</span>
                  <strong>
                    {deploymentDetail.deployment.target_path ||
                      "No disponible"}
                  </strong>
                </div>
                <div>
                  <span>Dominio/IP</span>
                  <strong>
                    {deploymentDetail.deployment.domain || "No disponible"}
                  </strong>
                </div>
                <div>
                  <span>Framework</span>
                  <strong>{deploymentDetail.deployment.framework}</strong>
                </div>
                <div>
                  <span>Comando build</span>
                  <strong>{deploymentDetail.deployment.build_command}</strong>
                </div>
                <div>
                  <span>Carpeta salida</span>
                  <strong>{deploymentDetail.deployment.output_folder}</strong>
                </div>
              </div>

              <div className="history-logs">
                <h3>Logs asociados</h3>

                {deploymentDetail.logs.length === 0 ? (
                  <p>No hay logs asociados a este despliegue.</p>
                ) : (
                  <div className="logs-list">
                    {deploymentDetail.logs.map((log) => (
                      <article className="log-item" key={log.id}>
                        <div className="log-main">
                          <div className="log-meta">
                            <span className={`log-level log-level-${log.level}`}>
                              {log.level}
                            </span>
                            <span>{log.type}</span>
                          </div>

                          <p>{log.message}</p>
                        </div>

                        <time>{formatDate(log.created_at)}</time>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
