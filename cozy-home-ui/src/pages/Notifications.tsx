import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, FileText, CreditCard, AlertCircle, Wrench, Info, ArrowLeft } from "lucide-react";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/api";
import { getCurrentUserRole, isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getNotificationTargetPath } from "@/lib/notification-routing";

function getNotificationIcon(type: string) {
  const iconMap: Record<string, any> = {
    RENT_REMINDER: CreditCard,
    RENT_OVERDUE: AlertCircle,
    PAYMENT_APPROVED: CreditCard,
    PAYMENT_REJECTED: CreditCard,
    DOCUMENT_APPROVED: FileText,
    DOCUMENT_REJECTED: FileText,
    MAINTENANCE_UPDATE: Wrench,
    ANNOUNCEMENT: Info,
    SYSTEM: Info,
  };
  return iconMap[type] || Bell;
}

function getNotificationColor(type: string) {
  const colorMap: Record<string, string> = {
    RENT_REMINDER: "text-blue-600 bg-blue-50",
    RENT_OVERDUE: "text-red-600 bg-red-50",
    PAYMENT_APPROVED: "text-green-600 bg-green-50",
    PAYMENT_REJECTED: "text-red-600 bg-red-50",
    DOCUMENT_APPROVED: "text-green-600 bg-green-50",
    DOCUMENT_REJECTED: "text-red-600 bg-red-50",
    MAINTENANCE_UPDATE: "text-purple-600 bg-purple-50",
    ANNOUNCEMENT: "text-blue-600 bg-blue-50",
    SYSTEM: "text-gray-600 bg-gray-50",
  };
  return colorMap[type] || "text-gray-600 bg-gray-50";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const loadNotifications = async () => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to view notifications.");
      setLoading(false);
      return;
    }

    try {
      const data = await getMyNotifications(token);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await markAllNotificationsRead(token);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await markNotificationRead(token, notificationId);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString("en-IN");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const role = getCurrentUserRole();
  const dashboardLink = role === "ADMIN" ? "/admin" : "/users/me";
  const appRole = role === "ADMIN" ? "ADMIN" : "TENANT";

  const handleNotificationClick = async (notification: any) => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (token && !notification?.isRead) {
      try {
        await markNotificationRead(token, notification.id);
      } catch {
        // Ignore read-fail and still navigate.
      }
    }

    const target =
      getNotificationTargetPath(notification, appRole) || dashboardLink;
    navigate(target);
  };

  // Sort notifications: unread first
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead === b.isRead) return 0;
    return a.isRead ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={dashboardLink}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold font-display">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              const isUnread = !notification.isRead;

              return (
                <div
                  key={notification.id}
                  onClick={() => void handleNotificationClick(notification)}
                  className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                    isUnread ? "border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="p-4 flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-sm ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </h3>
                        {isUnread && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleMarkAsRead(notification.id);
                            }}
                            className="text-xs text-primary hover:underline flex-shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {isUnread && (
                      <div className="flex-shrink-0">
                        <span className="block h-2 w-2 rounded-full bg-primary"></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
