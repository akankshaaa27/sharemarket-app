const API_BASE = "/api";

export const auth = {
  async login(emailOrUsername, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }
    
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
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
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to get user");
    }
    
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === "admin";
  },

  isEmployee() {
    const user = this.getUser();
    return user && (user.role === "employee" || user.role === "admin");
  },
};
