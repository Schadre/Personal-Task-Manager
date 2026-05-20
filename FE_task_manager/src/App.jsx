import { useState, useEffect, useCallback, useMemo } from "react";
import { Menu, X } from "lucide-react";
import { Toaster } from "react-hot-toast";
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
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [queryString, setQueryString] = useState("");
  const [quickFilter, setQuickFilter] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sort state
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
      if (!user) return;
      const query = buildFinalQuery(baseQuery);
      try {
        const data = await getTasks(query);
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks", err);
        if (
          user &&
          (err.message.includes("401") ||
            err.message.includes("Session expired"))
        ) {
          handleLogout();
        }
      }
    },
    [queryString, buildFinalQuery, user],
  );

  const handleFilterChange = useCallback((newQuery) => {
    setQueryString(newQuery);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setQueryString("");
    setQuickFilter(null);
    loadTasks("");
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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadTasks(queryString);
    }
  }, [queryString, sortColumn, sortDir, user, loadTasks]);

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

  if (loading) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <div className="flex flex-col md:flex-row h-screen bg-gray-100">
        {/* Hamburger button (mobile only) */}
        <button
          className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-md shadow-md"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          aria-label="Toggle menu"
        >
          {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar with responsive visibility */}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar setShowModal={() => setIsAddModalOpen(true)} />
        </div>

        {/* Overlay for mobile sidebar */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 w-full pt-16 sm:pt-4 md:pt-6">
          <Header user={user} onLogout={handleLogout} />

          <StatsCards tasks={filteredTasks} />

          {/* Quick filter buttons – scroll horizontally on mobile */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {["today", "overdue", "this_week"].map((name) => (
              <button
                key={name}
                onClick={() => handleQuickFilter(name)}
                className={`px-3 py-1 rounded text-sm font-medium capitalize whitespace-nowrap ${
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
    </>
  );
}

export default App;
