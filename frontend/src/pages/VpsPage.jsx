import { useEffect, useState } from "react";
import { LogsPanel } from "../components/LogsPanel.jsx";
import { VpsForm } from "../components/VpsForm.jsx";
import { VpsList } from "../components/VpsList.jsx";
import {
  createVps,
  deleteVps,
  getLogs,
  getVpsList,
  testVpsConnection,
} from "../services/vpsApi.js";

export function VpsPage() {
  const [vpsList, setVpsList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [pageError, setPageError] = useState("");

  async function loadVpsList() {
    setPageError("");
    setIsLoading(true);

    try {
      const response = await getVpsList();
      setVpsList(response.data || []);
    } catch (error) {
      setPageError("No se pudo cargar el listado de VPS.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLogs() {
    setIsLoadingLogs(true);

    try {
      const response = await getLogs({ type: "ssh_connection" });
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

  useEffect(() => {
    loadVpsList();
    loadLogs();
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">VPSeccret MVP</p>
          <h1>Gestión de VPS</h1>
          <p>
            Añade y consulta servidores VPS autorizados. En esta fase no se
            guarda ninguna contraseña SSH.
          </p>
        </div>
      </section>

      {pageError && <p className="error-message">{pageError}</p>}

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

      <section className="logs-section">
        <LogsPanel logs={logs} isLoading={isLoadingLogs} onReload={loadLogs} />
      </section>
    </main>
  );
}
