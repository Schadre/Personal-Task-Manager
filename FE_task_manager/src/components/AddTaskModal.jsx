import { useState } from "react";
import { createTask } from "../services/api";

export default function AddTaskModal({ close, reload }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [titleError, setTitleError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    setTitleError("");

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
      category: category.trim() || "Uncategorized",
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
            className={`w-full border px-4 py-3 rounded-xl ${
              titleError ? "border-red-500" : "border-slate-300"
            }`}
          />
          {titleError && (
            <p className="text-red-500 text-sm mt-1">{titleError}</p>
          )}
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
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details (optional)"
            rows="3"
            className="w-full border border-slate-300 px-4 py-3 rounded-xl"
          />
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
