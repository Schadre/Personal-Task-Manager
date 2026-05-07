function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function Header() {
  return (
    <div className="mb-8">
      <h2 className="text-4xl font-bold">{getGreeting()} 👋</h2>
      <p className="text-slate-500 mt-2">Stay organized and get things done.</p>
    </div>
  );
}
