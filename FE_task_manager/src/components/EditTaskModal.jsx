import { useState, useEffect } from "react";
import { updateTask } from "../services/api";

const EditTaskModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    category: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
        priority: task.priority || "medium",
        category: task.category || "Uncategorized",
      });
      setErrors({});
    }
  }, [task, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    else if (formData.title.length > 140)
      newErrors.title = "Title must be ≤ 140 characters";
    if (formData.description.length > 2000)
      newErrors.description = "Description must be ≤ 2000 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let isoDueDate = null;
      if (formData.due_date) {
        isoDueDate = new Date(formData.due_date).toISOString();
      }

      const updatedTask = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: isoDueDate,
        priority: formData.priority,
        category: formData.category.trim() || "Uncategorized",
      };

      await updateTask(task.id, updatedTask);
      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
      if (error.message.includes("404")) {
        setErrors({ form: "Task no longer exists. Refreshing list..." });
        onTaskUpdated();
        setTimeout(() => onClose(), 1500);
      } else {
        setErrors({ form: "Update failed. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl font-bold mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="edit-title"
              className="block text-sm font-medium mb-1"
            >
              Title *
            </label>
            <input
              id="edit-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 text-base ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full border rounded px-3 py-2 text-base ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-due-date"
              className="block text-sm font-medium mb-1"
            >
              Due Date
            </label>
            <input
              id="edit-due-date"
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-base border-gray-300"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-priority"
              className="block text-sm font-medium mb-1"
            >
              Priority
            </label>
            <select
              id="edit-priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-base border-gray-300"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-category"
              className="block text-sm font-medium mb-1"
            >
              Category
            </label>
            <input
              id="edit-category"
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-base border-gray-300"
            />
          </div>

          {errors.form && (
            <p className="text-red-500 text-sm mb-4">{errors.form}</p>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
