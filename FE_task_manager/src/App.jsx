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
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="flex flex-1">
        <Sidebar setShowModal={setShowModal} />

        <main className="flex-1 p-8">
          <Header />
          <StatsCards tasks={tasks} />
          <SearchFilter />
          <TaskTable tasks={tasks} reload={loadTasks} />
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 px-8 py-4 text-sm text-slate-500">
        <div className="flex justify-between">
          <span>© 2026 Echo Team — Personal Task Manager</span>
          <span>v1 · CSC480A Capstone</span>
        </div>
      </footer>

      {showModal && (
        <AddTaskModal close={() => setShowModal(false)} reload={loadTasks} />
      )}
    </div>
  );
}
