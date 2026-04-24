import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearAuthStorage } from "@/lib/auth";
import {
  Building2,
  LayoutDashboard,
  Home,
  CreditCard,
  FileText,
  Wrench,
  User,
  LogOut,
  Menu,
  X,
  AlertCircle,
  Bell,
  Bed,
} from "lucide-react";
import { getUnreadNotificationCount } from "@/api";

const tenantNavItems = [
  { label: "Overview", href: "/users/me", icon: LayoutDashboard },
  { label: "My Room", href: "/bookings/my-room", icon: Home },
  { label: "Payments", href: "/users/me/payments", icon: CreditCard },
  { label: "Documents", href: "/users/me/documents", icon: FileText },
  { label: "Maintenance", href: "/users/me/maintenance", icon: Wrench },
  { label: "Profile", href: "/users/me/profile", icon: User },
  { label: "Notifications", href: "/users/me/notifications", icon: Bell },
];

export function DashboardLayout({
  children,
  type = "tenant",
}: {
  children: React.ReactNode;
  type?: "tenant" | "admin";
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch notification count for both admin and tenant
    if (!type) return;
    
    const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (!token) return;

    const fetchUnreadCount = async () => {
      try {
        const data = await getUnreadNotificationCount(token);
        setUnreadCount(data?.count || 0);
      } catch (err) {
        console.error("Failed to fetch notification count");
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [type]);

  const handleLogout = () => {
    clearAuthStorage();
    window.location.href = "/login";
  };

  const adminNavItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Listings", href: "/admin/rooms", icon: Home },
    { label: "Bookings", href: "/admin/bookings", icon: FileText },
    {
      label: "Cancellations",
      href: "/admin/cancellation-requests",
      icon: AlertCircle,
    },
    { label: "Tenants", href: "/admin/tenants", icon: User },
    { label: "Room Management", href: "/admin/room-management", icon: Bed },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Documents", href: "/admin/documents", icon: FileText },
    { label: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  ];

  const navItems = type === "admin" ? adminNavItems : tenantNavItems;

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 max-w-[85vw] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        aria-label="Navigation"
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-display text-sidebar-primary-foreground truncate">
            Iris Plaza
          </span>
          <button
            className="ml-auto md:hidden p-2 -mr-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg touch-manipulation"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      "min-h-[44px] touch-manipulation",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors min-h-[44px] touch-manipulation"
          >
            <LogOut className="h-5 w-5" /> 
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-h-screen flex flex-col min-w-0 md:ml-64">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center px-4 gap-2 md:px-6">
          <button 
            className="md:hidden p-2 -ml-2 text-foreground hover:bg-secondary rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <h1 className="text-base md:text-lg font-semibold font-display capitalize truncate">
            {type === "admin" ? "Admin Panel" : "Tenant Portal"}
          </h1>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Notification Bell - For both tenants and admin */}
          <Link
            to={type === "admin" ? "/admin/notifications" : "/users/me/notifications"}
            className="relative p-2 text-foreground hover:bg-secondary rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {(type === "tenant" && unreadCount > 0) && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
