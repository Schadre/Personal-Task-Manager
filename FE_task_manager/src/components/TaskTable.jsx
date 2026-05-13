import { CheckCircle, Circle, Pencil, Trash2 } from "lucide-react";
import { updateTask, deleteTask } from "../services/api";

const SORTABLE_COLUMNS = {
  title: "Title",
  due_date: "Due Date",
  priority: "Priority",
  status: "Status",
};

const TaskTable = ({
  tasks,
  reload,
  onEditTask,
  sortColumn,
  sortDir,
  onSortChange,
}) => {
  const isOverdue = (task) => {
    if (!task.due_date || task.status === "completed") return false;
    return new Date(task.due_date) < new Date();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;
    try {
      await deleteTask(id);
      reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (task) => {
    const updatedStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await updateTask(task.id, { status: updatedStatus });
      reload();
    } catch (err) {
      console.error(err);
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {Object.entries(SORTABLE_COLUMNS).map(([key, label]) => (
              <th
                key={key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                onClick={() => onSortChange(key)}
              >
                {label}
                {getSortIcon(key)}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {task.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "—"}
                {isOverdue(task) && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full capitalize
                    ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => handleToggleComplete(task)}
                  className="flex items-center gap-1"
                  aria-label="Toggle complete"
                >
                  {task.status === "completed" ? (
                    <CheckCircle className="text-green-500" size={18} />
                  ) : (
                    <Circle className="text-gray-400" size={18} />
                  )}
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.category || "Uncategorized"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEditTask(task)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                  aria-label="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:text-red-900"
                  aria-label="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="p-6 text-center text-gray-500">No tasks found.</div>
      )}
    </div>
  );
};

export default TaskTable;
