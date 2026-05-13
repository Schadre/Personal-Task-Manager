import NotificationDisplay from "./NotificationDisplay";

export default function Header({ user }) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold">
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
          </h2>

          <p className="text-slate-500 mt-2">
            {user?.name
              ? "Stay organized and get things done."
              : "Sign in to manage your tasks."}
          </p>
        </div>

        {user && <NotificationDisplay />}
      </div>
    </div>
  );
}
