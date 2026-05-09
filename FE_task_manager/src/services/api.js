const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export const getTasks = async () => {
  const res = await fetch(`${API_BASE}/tasks`, {
    credentials: "include",
  });
  return handleResponse(res);
};

export const createTask = async (taskData) => {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
    credentials: "include",
  });
  return handleResponse(res);
};

export const updateTask = async (id, taskData) => {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
    credentials: "include",
  });
  return handleResponse(res);
};

export const deleteTask = async (id) => {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
};

export const loginWithGoogle = async (token) => {
  const res = await fetch("/auth/google/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
};

export const logout = async () => {
  const res = await fetch("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  return handleResponse(res);
};

export const getCurrentUser = async () => {
  const res = await fetch("/auth/me", {
    credentials: "include",
  });
  if (res.status === 401) return null;
  return res.json();
};
