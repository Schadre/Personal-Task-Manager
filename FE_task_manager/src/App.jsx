import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import SearchFilter from "./components/SearchFilter";
import TaskTable from "./components/TaskTable";
import AddTaskModal from "./components/AddTaskModal";
import { getTasks } from "./services/api";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar setShowModal={setShowModal} />

      <main className="flex-1 p-8">
        <Header />
        <StatsCards tasks={tasks} />
        <SearchFilter />
        <TaskTable tasks={tasks} reload={loadTasks} />
      </main>

      {showModal && (
        <AddTaskModal close={() => setShowModal(false)} reload={loadTasks} />
      )}
    </div>
  );
}
