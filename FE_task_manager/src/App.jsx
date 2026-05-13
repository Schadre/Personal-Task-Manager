import { useState, useEffect, useCallback, useMemo } from "react";
import { getTasks } from "./services/api";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import Sidebar from "./components/Sidebar";
import TaskTable from "./components/TaskTable";
import AddTaskModal from "./components/AddTaskModal";
import EditTaskModal from "./components/EditTaskModal";
import SearchFilter from "./components/SearchFilter";
import Login from "./components/Login";

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [queryString, setQueryString] = useState("");
  const [quickFilter, setQuickFilter] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // ---------- Sort state ----------
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const buildFinalQuery = useCallback(
    (baseQuery) => {
      const params = new URLSearchParams(baseQuery);
      params.set("sort", sortColumn);
      params.set("dir", sortDir);
      return params.toString();
    },
    [sortColumn, sortDir],
  );

  const loadTasks = useCallback(
    async (baseQuery = queryString) => {
      const query = buildFinalQuery(baseQuery);
      try {
        const data = await getTasks(query);
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks", err);
        if (
          err.message.includes("401") ||
          err.message.includes("Session expired")
        ) {
          handleLogout();
        }
      }
    },
    [queryString, buildFinalQuery],
  );

  const handleFilterChange = useCallback((newQuery) => {
    setQueryString(newQuery);

  }, []);

  useEffect(() => {
    loadTasks(queryString);
  }, [queryString, loadTasks]);

  useEffect(() => {
    loadTasks(queryString);
  }, [sortColumn, sortDir]); 

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    loadTasks();
  };

  const handleLogout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout error", err);
    }
    localStorage.removeItem("user");
    setUser(null);
    setTasks([]);
    setQueryString("");
    setQuickFilter(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadTasks();
    }
  }, []);

  // ---------- Client‑side quick filtering ----------
  const filteredTasks = useMemo(() => {
    if (!quickFilter) return tasks;

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return tasks.filter((task) => {
      if (!task.due_date) return false;

      const due = new Date(task.due_date);

      switch (quickFilter) {
        case "today":
          return due >= todayStart && due < todayEnd;
        case "overdue":
          return due < todayStart && task.status === "pending";
        case "this_week":
          return due >= todayStart && due <= weekEnd;
        default:
          return true;
      }
    });
  }, [tasks, quickFilter]);

  const handleQuickFilter = (filterName) => {
    setQuickFilter((prev) => (prev === filterName ? null : filterName));
  };

  // ---------- Sort handler (called from TaskTable) ----------
  const handleSortChange = useCallback((column) => {
    setSortColumn((prevCol) => {
      if (prevCol === column) {

        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return column;
      }

      setSortDir("asc");
      return column;
    });
  }, []);

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setShowModal={() => setIsAddModalOpen(true)} />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center">
          <Header user={user} />
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <StatsCards tasks={filteredTasks} />

        {/* Quick filter buttons */}
        <div className="flex gap-2 mb-3">
          {["today", "overdue", "this_week"].map((name) => (
            <button
              key={name}
              onClick={() => handleQuickFilter(name)}
              className={`px-3 py-1 rounded text-sm font-medium capitalize
                ${
                  quickFilter === name
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {name.replace("_", " ")}
            </button>
          ))}
        </div>

        <SearchFilter onFilterChange={handleFilterChange} />
        <TaskTable
          tasks={filteredTasks}
          reload={() => loadTasks(queryString)}
          onEditTask={handleEditTask}
          sortColumn={sortColumn}
          sortDir={sortDir}
          onSortChange={handleSortChange}
        />
      </div>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTaskAdded={() => loadTasks(queryString)}
      />
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={() => loadTasks(queryString)}
      />
    </div>
  );
}

export default App;
