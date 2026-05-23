export function VpsList({ vpsList, onDelete, onTestConnection }) {
  if (vpsList.length === 0) {
    return (
      <div className="card empty-state">
        <h2>No hay VPS guardadas</h2>
        <p>Añade tu primera VPS para empezar a preparar despliegues.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <h2>Servidores VPS</h2>
          <p>Listado de servidores guardados en SQLite.</p>
        </div>
        <span className="badge">{vpsList.length} VPS</span>
      </div>

      <div className="vps-list">
        {vpsList.map((vps) => (
          <article className="vps-item" key={vps.id}>
            <div>
              <h3>{vps.name}</h3>
              <p>
                {vps.ssh_user}@{vps.host}:{vps.ssh_port}
              </p>
              {vps.detected_os && <small>{vps.detected_os}</small>}
              {vps.notes && <small>{vps.notes}</small>}
            </div>

            <div className="vps-actions">
              <span className={`status status-${vps.status || "unknown"}`}>
                {vps.status || "unknown"}
              </span>

              <button type="button" onClick={() => onTestConnection(vps.id)}>
                Probar SSH
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={() => onDelete(vps.id)}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
