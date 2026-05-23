import { useEffect, useState } from "react";
import { VpsForm } from "../components/VpsForm.jsx";
import { VpsList } from "../components/VpsList.jsx";
import {
  createVps,
  deleteVps,
  getVpsList,
  testVpsConnection,
} from "../services/vpsApi.js";

export function VpsPage() {
  const [vpsList, setVpsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
      window.alert("Conexión SSH correcta.");
    } catch (error) {
      await loadVpsList();
      window.alert(error.data?.message || "No se pudo conectar por SSH.");
    }
  }

  useEffect(() => {
    loadVpsList();
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
    </main>
  );
}
