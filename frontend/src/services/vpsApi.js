const API_BASE_URL = "http://localhost:3000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Error en la petición");
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getVpsList() {
  return request("/vps");
}

export async function createVps(payload) {
  return request("/vps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteVps(id) {
  return request(`/vps/${id}`, {
    method: "DELETE",
  });
}

export async function testVpsConnection(id, password) {
  return request(`/vps/${id}/test-connection`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function getLogs(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.vps_id) {
    searchParams.set("vps_id", params.vps_id);
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  if (params.level) {
    searchParams.set("level", params.level);
  }

  const query = searchParams.toString();

  return request(`/logs${query ? `?${query}` : ""}`);
}

export async function runLocalBuild(file) {
  const formData = new FormData();
  formData.append("project_zip", file);

  const response = await fetch(`${API_BASE_URL}/build`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message || "Error al ejecutar el build local.",
    );
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function runPrecheck(file) {
  const formData = new FormData();
  formData.append("project_zip", file);

  const response = await fetch(`${API_BASE_URL}/precheck`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Error al ejecutar el pre-check.");
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function runDeploy({ file, projectName, vpsId, sshPassword }) {
  const formData = new FormData();

  formData.append("project_zip", file);
  formData.append("project_name", projectName);
  formData.append("vps_id", vpsId);
  formData.append("ssh_password", sshPassword);

  const response = await fetch(`${API_BASE_URL}/deploy`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Error al ejecutar el despliegue.");
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
}
