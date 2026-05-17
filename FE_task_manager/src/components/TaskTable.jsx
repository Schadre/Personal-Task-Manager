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

  // Helper to format date for mobile cards
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  // Priority badge style
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

  // Table header (visible only on desktop)
  const TableHeader = () => (
    <thead className="bg-gray-50 hidden md:table-header-group">
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
          Description
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Category
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );

  // Desktop table row
  const DesktopRow = ({ task }) => (
    <tr key={task.id} className="hover:bg-gray-50">
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
          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityStyle(task.priority)}`}
        >
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
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
      <td className="px-6 py-4 text-sm text-gray-500 break-words min-w-[200px]">
        {task.description || "—"}
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
  );

  // Mobile card layout
  const MobileCard = ({ task }) => (
    <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEditTask(task)}
            className="text-blue-600 hover:text-blue-800 p-2"
            aria-label="Edit"
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={() => handleDelete(task.id)}
            className="text-red-600 hover:text-red-800 p-2"
            aria-label="Delete"
          >
            <Trash2 size={20} />
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
            className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityStyle(task.priority)}`}
          >
            {task.priority}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-medium text-gray-500">Status:</span>
          <button
            onClick={() => handleToggleComplete(task)}
            className="flex items-center gap-1 text-sm"
          >
            {task.status === "completed" ? (
              <CheckCircle className="text-green-500" size={18} />
            ) : (
              <Circle className="text-gray-400" size={18} />
            )}
            <span>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
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
    </div>
  );

  return (
    <div className="mt-4">
      {/* Desktop table (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <TableHeader />
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <DesktopRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="p-6 text-center text-gray-500">No tasks found.</div>
        )}
      </div>

      {/* Mobile cards (visible only on mobile) */}
      <div className="md:hidden">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow">
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
