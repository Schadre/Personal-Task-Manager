import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { getNotifications, dismissNotification } from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const NotificationDisplay = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleDismiss = async (id) => {
    const original = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await dismissNotification(id);
      showSuccess("Notification dismissed");
    } catch (err) {
      console.error("Failed to dismiss notification", err);
      showError(err.message || "Dismiss failed");
      setNotifications(original);
    }
  };

  const handleBellClick = () => {
    setOpen((prev) => !prev);
    if (!open) fetchNotifications();
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-500 hover:text-indigo-600 focus:outline-none min-h-[44px] min-w-[44px]"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-screen max-w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          style={{ right: "1rem", left: "auto" }}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifications
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {unreadCount === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {n.task_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(n.due_date).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none p-1"
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDisplay;
