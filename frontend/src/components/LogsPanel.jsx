export function LogsPanel({ logs, isLoading, onReload }) {
  return (
    <div className="card logs-panel">
      <div className="section-header">
        <div>
          <h2>Logs recientes</h2>
          <p>Eventos guardados en la base de datos local.</p>
        </div>

        <button type="button" onClick={onReload} disabled={isLoading}>
          {isLoading ? "Cargando..." : "Recargar"}
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state small-empty">
          <h3>No hay logs todavía</h3>
          <p>Prueba una conexión SSH para generar los primeros logs.</p>
        </div>
      ) : (
        <div className="logs-list">
          {logs.map((log) => (
            <article className="log-item" key={log.id}>
              <div className="log-main">
                <div className="log-meta">
                  <span className={`log-level log-level-${log.level}`}>
                    {log.level}
                  </span>
                  <span>{log.type}</span>
                  {log.vps_name && <span>{log.vps_name}</span>}
                </div>

                <p>{log.message}</p>
              </div>

              <time>{new Date(log.created_at).toLocaleString()}</time>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
