const API = import.meta.env.VITE_API_BASE || "/api";

export const getTasks = async () => {
  const res = await fetch(`${API}/tasks`);
  return res.json();
};

export const createTask = async (task) => {
  await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
};

export const updateTask = async (id, data) => {
  await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const deleteTask = async (id) => {
  await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
};
