import { deleteTask, updateTask } from "../services/api";

export default function TaskTable({ tasks, reload }) {
  const completeTask = async (task) => {
    await updateTask(task.id, {
      status: "completed",
    });
    reload();
  };

  const remove = async (id) => {
    await deleteTask(id);
    reload();
  };

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      {tasks.map((task) => (
        <div key={task.id} className="flex justify-between p-4 border-b">
          <div>
            <h4 className="font-semibold">{task.title}</h4>
            <p className="text-sm text-slate-500">{task.due_date}</p>
          </div>

          <div className="space-x-2">
            <button
              onClick={() => completeTask(task)}
              className="bg-green-100 px-3 py-1 rounded"
            >
              ✓
            </button>

            <button
              onClick={() => remove(task.id)}
              className="bg-red-100 px-3 py-1 rounded"
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
