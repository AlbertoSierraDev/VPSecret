import { useState } from "react";

const initialForm = {
  name: "",
  host: "",
  ssh_port: "22",
  ssh_user: "",
  notes: "",
};

export function VpsForm({ onCreate }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await onCreate({
        name: form.name,
        host: form.host,
        ssh_port: Number(form.ssh_port || 22),
        ssh_user: form.ssh_user,
        notes: form.notes || null,
      });

      setForm(initialForm);
    } catch (error) {
      const errors = error.data?.errors;

      if (Array.isArray(errors)) {
        setErrorMessage(errors.join(" "));
      } else {
        setErrorMessage(error.data?.message || "No se pudo crear la VPS.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="section-header">
        <div>
          <h2>Añadir VPS</h2>
          <p>Guarda los datos no sensibles del servidor.</p>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Nombre
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="VPS Producción"
          />
        </label>

        <label>
          IP o dominio
          <input
            name="host"
            value={form.host}
            onChange={handleChange}
            placeholder="192.168.1.100"
          />
        </label>

        <label>
          Puerto SSH
          <input
            name="ssh_port"
            value={form.ssh_port}
            onChange={handleChange}
            placeholder="22"
          />
        </label>

        <label>
          Usuario SSH
          <input
            name="ssh_user"
            value={form.ssh_user}
            onChange={handleChange}
            placeholder="deploy"
          />
        </label>
      </div>

      <label>
        Notas
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Notas internas sobre esta VPS"
        />
      </label>

      <div className="warning-box">
        La contraseña SSH no se guarda. Se pedirá solo cuando se pruebe la
        conexión o se despliegue.
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar VPS"}
      </button>
    </form>
  );
}
