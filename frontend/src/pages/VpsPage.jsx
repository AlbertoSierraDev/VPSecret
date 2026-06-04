import { useEffect, useMemo, useState } from "react";
import { BuildPanel } from "../components/BuildPanel.jsx";
import { DeployPanel } from "../components/DeployPanel.jsx";
import { DeploymentsHistoryPanel } from "../components/DeploymentsHistoryPanel.jsx";
import { LogsPanel } from "../components/LogsPanel.jsx";
import { NginxPanel } from "../components/NginxPanel.jsx";
import { PrecheckPanel } from "../components/PrecheckPanel.jsx";
import { VpsForm } from "../components/VpsForm.jsx";
import { VpsList } from "../components/VpsList.jsx";
import {
  configureNginx,
  createVps,
  deleteVps,
  getLogs,
  getVpsList,
  runDeploy,
  runLocalBuild,
  runPrecheck,
  testVpsConnection,
} from "../services/vpsApi.js";

const sections = [
  {
    id: "resumen",
    label: "Resumen",
    description: "Estado general del panel local.",
  },
  {
    id: "vps",
    label: "VPS",
    description: "Servidores, conexión SSH y estado.",
  },
  {
    id: "despliegues",
    label: "Despliegues",
    description: "Pre-check, build y subida de dist.",
  },
  {
    id: "historial",
    label: "Historial",
    description: "Preparado para el siguiente paso del MVP.",
  },
  {
    id: "logs",
    label: "Logs",
    description: "Eventos recientes guardados en SQLite.",
  },
  {
    id: "nginx",
    label: "Nginx",
    description: "Configuración guiada del sitio estático.",
  },
  {
    id: "configuracion",
    label: "Configuración",
    description: "Parámetros locales no editables.",
  },
];

export function VpsPage() {
  const [activeSection, setActiveSection] = useState("resumen");
  const [vpsList, setVpsList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [pageError, setPageError] = useState("");

  const currentSection = useMemo(
    () => sections.find((section) => section.id === activeSection),
    [activeSection],
  );

  async function loadVpsList() {
    setPageError("");
    setIsLoading(true);

    try {
      const response = await getVpsList();
      setVpsList(response.data || []);
    } catch {
      setPageError("No se pudo cargar el listado de VPS.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLogs() {
    setIsLoadingLogs(true);

    try {
      const response = await getLogs();
      setLogs(response.data || []);
    } catch (error) {
      console.error("No se pudieron cargar los logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function handleCreateVps(payload) {
    await createVps(payload);
    await loadVpsList();
  }

  async function handleDeleteVps(id) {
    const confirmed = window.confirm("¿Seguro que quieres eliminar esta VPS?");

    if (!confirmed) {
      return;
    }

    await deleteVps(id);
    await loadVpsList();
    await loadLogs();
  }

  async function handleTestConnection(id) {
    const password = window.prompt(
      "Introduce la contraseña SSH. No se guardará en VPSeccret.",
    );

    if (!password) {
      return;
    }

    try {
      await testVpsConnection(id, password);
      await loadVpsList();
      await loadLogs();
      window.alert("Conexión SSH correcta.");
    } catch (error) {
      await loadVpsList();
      await loadLogs();
      window.alert(error.data?.message || "No se pudo conectar por SSH.");
    }
  }

  async function handleRunPrecheck(file) {
    const response = await runPrecheck(file);
    await loadLogs();
    return response;
  }

  async function handleRunBuild(file) {
    const response = await runLocalBuild(file);
    await loadLogs();
    return response;
  }

  async function handleRunDeploy(payload) {
    const response = await runDeploy(payload);
    await loadVpsList();
    await loadLogs();
    setHistoryRefreshKey((currentKey) => currentKey + 1);
    return response;
  }

  async function handleConfigureNginx(payload) {
    const response = await configureNginx(payload);
    await loadLogs();
    return response;
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadVpsList();
      loadLogs();
    });
  }, []);

  function renderActiveSection() {
    if (activeSection === "resumen") {
      return (
        <div className="section-stack">
          <div className="summary-grid">
            <article className="metric-card">
              <span>VPS guardadas</span>
              <strong>{vpsList.length}</strong>
              <p>Servidores registrados en la base de datos local.</p>
            </article>

            <article className="metric-card">
              <span>Logs recientes</span>
              <strong>{logs.length}</strong>
              <p>Eventos cargados desde SQLite para esta sesión.</p>
            </article>

            <article className="metric-card">
              <span>Modo</span>
              <strong>Local</strong>
              <p>Panel pensado para uso privado durante el MVP.</p>
            </article>
          </div>

          <div className="card">
            <div className="section-header">
              <div>
                <h2>Flujo actual</h2>
                <p>Gestiona VPS, valida ZIP, construye y despliega dist.</p>
              </div>
            </div>

            <div className="flow-list">
              <span>1. Añade una VPS autorizada.</span>
              <span>2. Prueba SSH solo cuando lo necesites.</span>
              <span>3. Ejecuta pre-check y build local del ZIP.</span>
              <span>4. Despliega dist y configura Nginx por separado.</span>
            </div>

            <div className="warning-box">
              La contraseña SSH se pide únicamente al ejecutar acciones
              concretas. No se guarda en VPSeccret.
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "vps") {
      return (
        <section className="content-grid">
          <VpsForm onCreate={handleCreateVps} />

          {isLoading ? (
            <div className="card">
              <p>Cargando VPS...</p>
            </div>
          ) : (
            <VpsList
              vpsList={vpsList}
              onDelete={handleDeleteVps}
              onTestConnection={handleTestConnection}
            />
          )}
        </section>
      );
    }

    if (activeSection === "despliegues") {
      return (
        <div className="section-stack">
          <PrecheckPanel onRunPrecheck={handleRunPrecheck} />
          <BuildPanel onRunBuild={handleRunBuild} />
          <DeployPanel vpsList={vpsList} onRunDeploy={handleRunDeploy} />
        </div>
      );
    }

    if (activeSection === "historial") {
      return <DeploymentsHistoryPanel refreshKey={historyRefreshKey} />;
    }

    if (activeSection === "logs") {
      return (
        <LogsPanel logs={logs} isLoading={isLoadingLogs} onReload={loadLogs} />
      );
    }

    if (activeSection === "nginx") {
      return (
        <NginxPanel vpsList={vpsList} onConfigureNginx={handleConfigureNginx} />
      );
    }

    return (
      <div className="card settings-panel">
        <div className="section-header">
          <div>
            <h2>Configuración local</h2>
            <p>Información fija del MVP actual. Esta sección aún no edita datos.</p>
          </div>
        </div>

        <div className="settings-grid">
          <div>
            <span>Ruta base por defecto</span>
            <strong>/var/www</strong>
          </div>
          <div>
            <span>Puerto SSH por defecto</span>
            <strong>22</strong>
          </div>
          <div>
            <span>Modo de uso</span>
            <strong>Local</strong>
          </div>
        </div>

        <div className="warning-box">
          No guardes contraseñas SSH ni sudo. Usa un usuario deploy mejor que
          root y no subas credenciales a GitHub.
        </div>
      </div>
    );
  }

  return (
    <main className="page">
      <header className="app-header">
        <div>
          <p className="eyebrow">VPSeccret MVP</p>
          <h1>VPSeccret</h1>
          <p>
            Panel local para gestionar VPS y desplegar proyectos React/Vite
            mediante ZIP.
          </p>
        </div>
      </header>

      {pageError && <p className="error-message">{pageError}</p>}

      <div className="dashboard-layout">
        <section className="workspace-panel">
          <div className="workspace-header">
            <div>
              <p className="eyebrow">Panel principal</p>
              <h2>{currentSection?.label}</h2>
              <p>{currentSection?.description}</p>
            </div>
          </div>

          {renderActiveSection()}
        </section>

        <aside className="side-index" aria-label="Índice de secciones">
          <div className="side-index-header">
            <span>Índice</span>
            <small>{sections.length} secciones</small>
          </div>

          <nav className="section-nav">
            {sections.map((section) => (
              <button
                type="button"
                key={section.id}
                className={section.id === activeSection ? "active" : ""}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.label}</span>
                <small>{section.description}</small>
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </main>
  );
}
