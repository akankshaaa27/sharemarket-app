const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  if (!res.ok) {
    let err;
    try {
      err = await res.json();
    } catch {
      err = { error: res.statusText };
    }
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export const api = {
  // Shareholders (file-based)
  listShareholders: (params = {}) =>
    request(`/shareholders?${new URLSearchParams(params)}`),
  getShareholder: (id) => request(`/shareholders/${id}`),
  createShareholder: (data) =>
    request(`/shareholders`, { method: "POST", body: JSON.stringify(data) }),
  updateShareholder: (id, data) =>
    request(`/shareholders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteShareholder: (id) =>
    request(`/shareholders/${id}`, { method: "DELETE" }),

  // DMAT (Mongo)
  listDmat: (params = {}) => request(`/dmat?${new URLSearchParams(params)}`),
  getDmat: (id) => request(`/dmat/${id}`),
  createDmat: (data) =>
    request(`/dmat`, { method: "POST", body: JSON.stringify(data) }),
  updateDmat: (id, data) =>
    request(`/dmat/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDmat: (id) => request(`/dmat/${id}`, { method: "DELETE" }),

  // Client Profiles (Mongo)
  listProfiles: (params = {}) =>
    request(`/client-profiles?${new URLSearchParams(params)}`),
  getProfile: (id) => request(`/client-profiles/${id}`),
  createProfile: (data) =>
    request(`/client-profiles`, { method: "POST", body: JSON.stringify(data) }),
  updateProfile: (id, data) =>
    request(`/client-profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProfile: (id) =>
    request(`/client-profiles/${id}`, { method: "DELETE" }),
};
