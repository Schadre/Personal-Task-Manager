import { useState, useEffect } from "react";
import { getTasks } from "./services/api";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import Sidebar from "./components/Sidebar";
import TaskTable from "./components/TaskTable";
import AddTaskModal from "./components/AddTaskModal";
import EditTaskModal from "./components/EditTaskModal";

function App() {
  const [tasks, setTasks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setShowModal={() => setIsAddModalOpen(true)} />
      <div className="flex-1 p-6 overflow-auto">
        <Header />
        <StatsCards tasks={tasks} />
        <TaskTable
          tasks={tasks}
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
