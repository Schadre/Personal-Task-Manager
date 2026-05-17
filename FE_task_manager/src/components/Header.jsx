import NotificationDisplay from "./NotificationDisplay";

export default function Header({ user }) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
          </h2>
          <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base">
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
