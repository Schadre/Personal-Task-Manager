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
  if (priority)
    activeFilters.push({ label: `Priority: ${priority}`, field: "priority" });
  if (status)
    activeFilters.push({ label: `Status: ${status}`, field: "status" });
  if (category)
    activeFilters.push({ label: `Category: ${category}`, field: "category" });
  if (search)
    activeFilters.push({ label: `Search: "${search}"`, field: "search" });

  return (
    <div className="search-filter">
      <div className="filter-controls flex gap-2 mb-3">
        {/* Search box */}
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />

        {/* Priority dropdown */}
        <select
          aria-label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* Status dropdown */}
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        {/* Category input */}
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="active-filters flex gap-2 mb-3">
          {activeFilters.map((f, i) => (
            <span
              key={i}
              className="chip bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
            >
              {f.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
