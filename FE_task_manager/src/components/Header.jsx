import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { logout } from "../services/api";
import NotificationDisplay from "./NotificationDisplay";

export default function Header({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("user");
    if (onLogout) onLogout();
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {/* Greeting section */}
        <div>
          <h2 className="text-4xl font-bold">
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
          </h2>
          <p className="text-slate-500 mt-2">
            Stay organized and get things done.
          </p>
        </div>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 focus:outline-none"
            aria-label="User menu"
          >
            {user?.profile_pic ? (
              <img
                src={user.profile_pic}
                alt={user.name || "User avatar"}
                className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-blue-500 transition"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user?.name || user?.email}
            </span>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification bell – placed below the top row */}
      <NotificationDisplay />
    </div>
  );
}
