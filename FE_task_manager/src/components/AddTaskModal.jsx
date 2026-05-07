import { useState } from "react";
import { createTask } from "../services/api";

export default function AddTaskModal({ close, reload }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    if (title.length > 140) {
      setTitleError("Title must be 140 characters or less");
      return;
    }
    if (description.length > 2000) {
      setDescError("Description must be 2000 characters or less");
      return;
    }
    setTitleError("");
    setDescError("");

    // Convert date picker value (YYYY-MM-DD) to ISO-8601
    let dueDateISO = null;
    if (dueDate) {
      dueDateISO = new Date(dueDate).toISOString(); // e.g., 2025-12-31T00:00:00.000Z
    }

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      due_date: dueDateISO,
      category: category.trim() || "Uncategorized",
      priority: priority,
    };

    await createTask(newTask);
    reload();
    close();
  };

  const handleCancel = () => {
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4">New Task</h3>

        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError("");
            }}
            placeholder="e.g., Finish capstone report"
            maxLength={140}
            className={`w-full border px-4 py-3 rounded-xl ${
              titleError ? "border-red-500" : "border-slate-300"
            }`}
          />
          {titleError && (
            <p className="text-red-500 text-sm mt-1">{titleError}</p>
          )}
          <div className="text-right text-xs text-slate-400 mt-1">
            {title.length}/140
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (descError) setDescError("");
            }}
            placeholder="Add details (optional)"
            rows="3"
            maxLength={2000}
            className="w-full border border-slate-300 px-4 py-3 rounded-xl"
          />
          {descError && (
            <p className="text-red-500 text-sm mt-1">{descError}</p>
          )}
          <div className="text-right text-xs text-slate-400 mt-1">
            {description.length}/2000
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Due Date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-slate-300 px-4 py-3 rounded-xl"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border border-slate-300 px-4 py-3 rounded-xl"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Category
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Work, Personal, Study"
            className="w-full border border-slate-300 px-4 py-3 rounded-xl"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700"
          >
            Save Task
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
