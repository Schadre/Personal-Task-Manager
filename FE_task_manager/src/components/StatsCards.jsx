export default function StatsCards({ tasks }) {
  const pending = tasks.filter((t) => t.status === "pending").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card title="Pending" value={pending} />
      <Card title="Completed" value={completed} />
      <Card title="Total" value={tasks.length} />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <p className="text-slate-500">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}
