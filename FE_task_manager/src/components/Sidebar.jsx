export default function Sidebar({ setShowModal }) {
  return (
    <aside className="w-64 bg-white border-r p-6">
      <h1 className="text-2xl font-bold text-indigo-600">Task Manager</h1>
      <button
        onClick={() => setShowModal(true)}
        className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-xl"
      >
        + Add Task
      </button>
    </aside>
  );
}
