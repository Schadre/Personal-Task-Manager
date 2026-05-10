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

  // Checking if pending task is overdue
  const isOverdue = (task) => {
    if (task.status !== "pending") return false;
    if (!task.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Prioritizing badge colours
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Status badge (with overdue override)
  const getStatusBadge = (task) => {
    if (isOverdue(task)) {
      return { label: "Overdue", classes: "bg-red-100 text-red-800" };
    }
    if (task.status === "completed") {
      return { label: "Completed", classes: "bg-green-100 text-green-800" };
    }
    return { label: "Pending", classes: "bg-gray-100 text-gray-800" };
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="text-center py-16 px-4">
          <svg
            className="mx-auto h-16 w-16 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            No tasks yet
          </h3>
          <p className="mt-2 text-slate-500">
            Click the <strong className="font-medium">+ Add Task</strong> button
            to create your first one.
          </p>
        </div>
      </div>
    );
  }

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
              Priority
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
          {tasks.map((task) => {
            const statusBadge = getStatusBadge(task);
            return (
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
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {task.category || "Uncategorized"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {formatDate(task.due_date)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}
                  >
                    {task.priority
                      ? task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)
                      : "Medium"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.classes}`}
                  >
                    {statusBadge.label}
                  </span>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
