import { useState } from "react";

export default function SearchFilter({ tasks, setFilteredTasks }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term)),
      );
      setFilteredTasks(filtered);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow mb-6">
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full border px-4 py-3 rounded-xl"
      />
    </div>
  );
}
