import { CheckCircle, Circle, Pencil, Trash2 } from "lucide-react";
import { updateTask, deleteTask } from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const SORTABLE_COLUMNS = {
  title: "Title",
  due_date: "Due Date",
  priority: "Priority",
  status: "Status",
};

const TaskTable = ({
  tasks = [],
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

  const handleDelete = async (task) => {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) return;

    try {
      await deleteTask(task.id);
      showSuccess("Task deleted");
      reload();
    } catch (err) {
      console.error(err);
      showError(err.message || "Delete failed");
    }
  };

  const handleToggleComplete = async (task) => {
    const updatedStatus = task.status === "completed" ? "pending" : "completed";

    try {
      await updateTask(task.id, { status: updatedStatus });
      showSuccess(`Task marked as ${updatedStatus}`);
      reload();
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to update status");
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const getAriaSort = (column) => {
    if (sortColumn !== column) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const formatLabel = (value) => {
    if (!value) return "Pending";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const TableHeader = () => (
    <thead className="bg-gray-50 hidden md:table-header-group">
      <tr>
        {Object.entries(SORTABLE_COLUMNS).map(([key, label]) => (
          <th
            key={key}
            scope="col"
            aria-sort={getAriaSort(key)}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            <button
              type="button"
              onClick={() => onSortChange(key)}
              className="w-full text-left uppercase hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              aria-label={`Sort tasks by ${label}`}
            >
              {label}
              {getSortIcon(key)}
            </button>
          </th>
        ))}

        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          Description
        </th>

        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          Category
        </th>

        <th
          scope="col"
          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          Actions
        </th>
      </tr>
    </thead>
  );

  const DesktopRow = ({ task }) => {
    const priority = task.priority || "medium";
    const status = task.status || "pending";

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {task.title}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDate(task.due_date)}
          {isOverdue(task) && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
              Overdue
            </span>
          )}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityStyle(
              priority
            )}`}
          >
            {formatLabel(priority)}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <button
            type="button"
            onClick={() => handleToggleComplete(task)}
            className="flex items-center gap-1 hover:text-blue-700"
            aria-label={`Mark task ${task.title} as ${
              status === "completed" ? "pending" : "completed"
            }`}
          >
            {status === "completed" ? (
              <CheckCircle className="text-green-500" size={18} aria-hidden="true" />
            ) : (
              <Circle className="text-gray-400" size={18} aria-hidden="true" />
            )}
            {formatLabel(status)}
          </button>
        </td>

        <td className="px-6 py-4 text-sm text-gray-500 break-words min-w-[200px]">
          {task.description || "—"}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {task.category || "Uncategorized"}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            type="button"
            onClick={() => onEditTask(task)}
            className="text-blue-600 hover:text-blue-900 mr-3 p-2 rounded"
            aria-label={`Edit task ${task.title}`}
          >
            <Pencil size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => handleDelete(task)}
            className="text-red-600 hover:text-red-900 p-2 rounded"
            aria-label={`Delete task ${task.title}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </td>
      </tr>
    );
  };

  const MobileCard = ({ task }) => {
    const priority = task.priority || "medium";
    const status = task.status || "pending";

    return (
      <article
        className="bg-white rounded-lg shadow p-4 mb-4 md:hidden"
        aria-labelledby={`task-title-${task.id}`}
      >
        <div className="flex justify-between items-start gap-3">
          <h3
            id={`task-title-${task.id}`}
            className="text-lg font-semibold text-gray-900"
          >
            {task.title}
          </h3>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEditTask(task)}
              className="text-blue-600 hover:text-blue-800 p-2 rounded"
              aria-label={`Edit task ${task.title}`}
            >
              <Pencil size={20} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(task)}
              className="text-red-600 hover:text-red-800 p-2 rounded"
              aria-label={`Delete task ${task.title}`}
            >
              <Trash2 size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="font-medium text-gray-500">Due:</span>
            <span className="text-gray-700">{formatDate(task.due_date)}</span>
            {isOverdue(task) && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-medium text-gray-500">Priority:</span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityStyle(
                priority
              )}`}
            >
              {formatLabel(priority)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-medium text-gray-500">Status:</span>
            <button
              type="button"
              onClick={() => handleToggleComplete(task)}
              className="flex items-center gap-1 text-sm hover:text-blue-700"
              aria-label={`Mark task ${task.title} as ${
                status === "completed" ? "pending" : "completed"
              }`}
            >
              {status === "completed" ? (
                <CheckCircle className="text-green-500" size={18} aria-hidden="true" />
              ) : (
                <Circle className="text-gray-400" size={18} aria-hidden="true" />
              )}
              <span>{formatLabel(status)}</span>
            </button>
          </div>

          {task.description && (
            <div>
              <span className="font-medium text-gray-500">Description:</span>
              <p className="text-gray-700 text-sm mt-1">{task.description}</p>
            </div>
          )}

          <div>
            <span className="font-medium text-gray-500">Category:</span>
            <span className="ml-2 text-gray-700">
              {task.category || "Uncategorized"}
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mt-4">
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full" aria-label="Task list">
          <TableHeader />
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <DesktopRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="p-6 text-center text-gray-600" role="status">
            No tasks found.
          </div>
        )}
      </div>

      <div className="md:hidden">
        {tasks.length === 0 ? (
          <div
            className="p-6 text-center text-gray-600 bg-white rounded-lg shadow"
            role="status"
          >
            No tasks found.
          </div>
        ) : (
          tasks.map((task) => <MobileCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};

export default TaskTable;