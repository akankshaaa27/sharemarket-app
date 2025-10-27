const API_BASE = "/api";

async function requestWithAuth(path, options = {}) {
  const token = localStorage.getItem("token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  
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

export const apiAuth = {
  listUsers: () => requestWithAuth("/users"),
  getUser: (id) => requestWithAuth(`/users/${id}`),
  updateUser: (id, data) =>
    requestWithAuth(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetUserPassword: (id, newPassword) =>
    requestWithAuth(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),
  deleteUser: (id) =>
    requestWithAuth(`/users/${id}`, { method: "DELETE" }),
};
