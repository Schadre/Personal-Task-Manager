import { useState } from "react";
import { createTask } from "../services/api";

export default function AddTaskModal({ close, reload }) {
  const [title, setTitle] = useState("");

  const save = async () => {
    await createTask({ title });
    reload();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center">
      <div className="bg-white p-6 rounded-2xl w-96">
        <h3 className="text-2xl font-bold mb-4">Add Task</h3>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full border px-4 py-3 rounded-xl"
        />

        <button
          onClick={save}
          className="w-full bg-indigo-600 text-white mt-4 py-3 rounded-xl"
        >
          Save Task
        </button>
      </div>
    </div>
  );
}
