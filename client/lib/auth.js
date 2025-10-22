const API_BASE = (typeof __API_BASE__ !== "undefined" && __API_BASE__) ? __API_BASE__ : "/api";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";

function setLocalAdminSession() {
  const user = {
    id: "local-admin",
    username: ADMIN_USERNAME,
    name: "Administrator",
    email: "admin@local",
    role: "admin",
  };
  localStorage.setItem("isAdminLoggedIn", "true");
  localStorage.setItem("user", JSON.stringify(user));
  return { user };
}

export const auth = {
  async login(emailOrUsername, password) {
    const identifier = String(emailOrUsername || "").trim().toLowerCase();
    const pass = String(password || "").trim();

    // Frontend-only admin login (no API, no JWT)
    if (identifier === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      return setLocalAdminSession();
    }

    throw new Error("Invalid username or password");
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }
    return data;
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to send reset email");
    }
    return data;
  },

  async resetPassword(token, password) {
    const res = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Password reset failed");
    }
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Password change failed");
    }
    return data;
  },

  async getMe() {
    // Return local admin session if present
    if (localStorage.getItem("isAdminLoggedIn") === "true") {
      const user = this.getUser() || {
        id: "local-admin",
        username: ADMIN_USERNAME,
        name: "Administrator",
        email: "admin@local",
        role: "admin",
      };
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    }

    throw new Error("Not authenticated");
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAdminLoggedIn");
  },

  getToken() {
    // No JWT in frontend-only admin flow; kept for compatibility
    return localStorage.getItem("token");
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return localStorage.getItem("isAdminLoggedIn") === "true" || !!this.getToken();
  },

  isAdmin() {
    if (localStorage.getItem("isAdminLoggedIn") === "true") return true;
    const user = this.getUser();
    return user && user.role === "admin";
  },

  isEmployee() {
    const user = this.getUser();
    return user && (user.role === "employee" || user.role === "admin");
  },
};
