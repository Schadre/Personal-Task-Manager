import NotificationDisplay from "./NotificationDisplay";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function Header({ user }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold">
            {getGreeting()}
            {user?.name ? `, ${user.name}` : ""} 👋
          </h2>
          <p className="text-slate-500 mt-2">
            {user?.name
              ? "Stay organized and get things done."
              : "Sign in to manage your tasks."}
          </p>
        </div>
        <NotificationDisplay />
      </div>
    </div>
  );
}
