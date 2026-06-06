import { useState, useEffect, useRef } from "react";
import { createTask } from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const FOCUSABLE_ELEMENTS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function AddTaskModal({ isOpen, onClose, onTaskAdded }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    category: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        category: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement;

    const getFocusableElements = () =>
      modalRef.current
        ? Array.from(modalRef.current.querySelectorAll(FOCUSABLE_ELEMENTS))
        : [];

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    setTimeout(() => {
      const firstFocusableElement = getFocusableElements()[0];
      firstFocusableElement?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [isOpen, onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 140) {
      newErrors.title = "Title must be 140 characters or fewer";
    }

    if (formData.description.length > 2000) {
      newErrors.description = "Description must be 2000 characters or fewer";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      let isoDueDate = null;

      if (formData.due_date) {
        isoDueDate = new Date(formData.due_date).toISOString();
      }

      await createTask({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: isoDueDate,
        priority: formData.priority,
        category: formData.category.trim() || "Uncategorized",
      });

      showSuccess("Task created");
      onTaskAdded();
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
      showError(error.message || "Creation failed");
      setErrors({ form: "Creation failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-modal-title"
        aria-describedby={errors.form ? "add-task-form-error" : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="add-task-modal-title" className="text-lg sm:text-xl font-bold">
            Add New Task
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close add task modal"
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={140}
              aria-required="true"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              className={`w-full border rounded px-3 py-2 text-base ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p id="title-error" className="text-red-700 text-sm mt-1" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              maxLength={2000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              className={`w-full border rounded px-3 py-2 text-base ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p
                id="description-error"
                className="text-red-700 text-sm mt-1"
                role="alert"
              >
                {errors.description}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="due_date"
              className="block text-sm font-medium mb-1"
            >
              Due Date
            </label>
            <input
              id="due_date"
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-base border-gray-300"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="priority"
              className="block text-sm font-medium mb-1"
            >
              Priority
            </label>
            <select
              id="priority"
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
              htmlFor="category"
              className="block text-sm font-medium mb-1"
            >
              Category
            </label>
            <input
              id="category"
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-base border-gray-300"
            />
          </div>

          {errors.form && (
            <p id="add-task-form-error" className="text-red-700 text-sm mb-4" role="alert">
              {errors.form}
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border rounded hover:bg-gray-100 order-2 sm:order-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}