import { deleteTask, updateTask } from "../services/api";

export default function TaskTable({ tasks, reload, onEditTask }) {
  const toggleComplete = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask(task.id, { status: newStatus });
    reload();
  };

  const remove = async (id) => {
    if (window.confirm("Delete this task?")) {
      await deleteTask(id);
      reload();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {tasks.map((task) => (
            <tr
              key={task.id}
              className={task.status === "completed" ? "bg-slate-50" : ""}
            >
              <td className="px-6 py-4">
                <div
                  className={
                    task.status === "completed"
                      ? "line-through text-slate-400"
                      : ""
                  }
                >
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-sm text-slate-400 truncate max-w-xs">
                    {task.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-sm">{task.category || "—"}</td>
              <td className="px-6 py-4 text-sm">{formatDate(task.due_date)}</td>
              <td className="px-6 py-4 text-sm">
                {task.status === "completed" ? "✅ Done" : "⏳ Pending"}
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                <button
                  onClick={() => onEditTask?.(task)}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Edit task"
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleComplete(task)}
                  className="text-green-600 hover:text-green-800"
                  aria-label="Toggle complete"
                >
                  ✓
                </button>
                <button
                  onClick={() => remove(task.id)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Delete"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                No tasks yet. Click "+ Add Task" to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
