import { useState, useEffect } from "react";
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
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
      setFilteredTasks(data);
    } catch (err) {
      console.error("Failed to load tasks", err);

      if (
        err.message.includes("401") ||
        err.message.includes("Failed to fetch")
      ) {
        handleLogout();
      }
    }
  };

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
    setFilteredTasks([]);
  };


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadTasks();
    }
  }, []);

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

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
        <SearchFilter tasks={tasks} setFilteredTasks={setFilteredTasks} />
        <TaskTable
          tasks={filteredTasks}
          reload={loadTasks}
          onEditTask={handleEditTask}
        />
      </div>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTaskAdded={loadTasks}
      />
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={loadTasks}
      />
    </div>
  );
}

export default App;
