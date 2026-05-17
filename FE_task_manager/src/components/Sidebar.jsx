export default function Sidebar({ setShowModal }) {
  return (
    <aside className="h-full w-full md:w-64 bg-white border-r p-4 sm:p-6 flex flex-col">
      <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">
        Task Manager
      </h1>
      <button
        onClick={() => setShowModal(true)}
        className="mt-6 sm:mt-8 w-full bg-indigo-600 text-white py-2 sm:py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm sm:text-base"
      >
        + Add Task
      </button>
    </aside>
  );
}
