import { useState, useEffect } from "react";

const SearchFilter = ({ onFilterChange }) => {
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();

    if (priority) params.append("priority", priority);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (search) params.append("q", search);

    onFilterChange(params.toString());
  }, [priority, status, category, search, onFilterChange]);

  const clearFilters = () => {
    setPriority("");
    setStatus("");
    setCategory("");
    setSearch("");
  };

  const activeFilters = [];

  if (priority) {
    activeFilters.push({ label: `Priority: ${priority}`, field: "priority" });
  }

  if (status) {
    activeFilters.push({ label: `Status: ${status}`, field: "status" });
  }

  if (category) {
    activeFilters.push({ label: `Category: ${category}`, field: "category" });
  }

  if (search) {
    activeFilters.push({ label: `Search: "${search}"`, field: "search" });
  }

  return (
    <section className="search-filter" aria-label="Task search and filters">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 mb-3">
        <div>
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <input
            id="task-search"
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          />
        </div>

        <div>
          <label htmlFor="priority-filter" className="sr-only">
            Filter tasks by priority
          </label>
          <select
            id="priority-filter"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" className="sr-only">
            Filter tasks by status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="category-filter" className="sr-only">
            Filter tasks by category
          </label>
          <input
            id="category-filter"
            type="text"
            placeholder="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          />
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 w-full sm:w-auto"
        >
          Clear Filters
        </button>
      </div>

      {activeFilters.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-3"
          aria-label="Active filters"
          aria-live="polite"
        >
          {activeFilters.map((filter, index) => (
            <span
              key={`${filter.field}-${index}`}
              className="chip bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
            >
              {filter.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export default SearchFilter;