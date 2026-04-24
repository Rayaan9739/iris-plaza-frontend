import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Building2, Menu, X, Bell, CreditCard, User, LayoutDashboard, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getMyNotifications, markNotificationsRead } from "@/api";
import { clearAuthStorage, getAccessToken, getCurrentUserRole } from "@/lib/auth";
import { getNotificationTargetPath } from "@/lib/notification-routing";

interface NavLink {
  label: string;
  href: string;
  badge?: boolean;
}

interface NavbarProps {
  transparent?: boolean;
  isLoggedIn?: boolean;
}

export function Navbar({
  transparent = false,
  isLoggedIn = false,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      const clickedInsideDesktopProfile = profileRef.current?.contains(
        event.target as Node,
      );
      const clickedInsideMobileProfile = mobileProfileRef.current?.contains(
        event.target as Node,
      );
      if (!clickedInsideDesktopProfile && !clickedInsideMobileProfile) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];
  const visibleLinks = navLinks;
  const role = getCurrentUserRole();
  const isAdmin = role === "ADMIN";
  const dashboardHref = isAdmin ? "/admin" : "/users/me";
  const unreadCount = notifications.filter((n) => !n?.isRead).length;

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getAccessToken();
    if (!token) return;

    let stopped = false;
    const load = async () => {
      try {
        const list = await getMyNotifications(token);
        if (!stopped) {
          setNotifications(Array.isArray(list) ? list : []);
        }
      } catch {
        // keep navbar stable if polling fails
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 10000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [isLoggedIn]);

  async function handleToggleNotifications() {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
    if (!showNotifications && unreadCount > 0) {
      try {
        const token = getAccessToken();
        if (token) {
          await markNotificationsRead(token);
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }
  }

  function handleProfileClick() {
    setShowProfile(!showProfile);
    setShowNotifications(false);
    setMobileOpen(false);
  }

  function handleNotificationClick(item: any) {
    const target =
      getNotificationTargetPath(item, isAdmin ? "ADMIN" : "TENANT") ||
      "/notifications";
    navigate(target);
    setShowNotifications(false);
  }

  function handleLogout() {
    clearAuthStorage();
    window.location.href = "/login";
  }

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        transparent && !scrolled
          ? "bg-transparent border-transparent"
          : "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Mobile menu button - left side */}
        <button
          className={cn(
            "md:hidden h-9 w-9 inline-flex items-center justify-center",
            transparent && !scrolled ? "text-white" : "",
          )}
          onClick={() => {
            setMobileOpen((prev) => !prev);
            setShowProfile(false);
            setShowNotifications(false);
          }}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Logo - center on mobile, left on desktop */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span
            className={cn(
              "text-xl font-bold font-display",
              transparent && !scrolled ? "text-white" : "text-foreground",
            )}
          >
            Iris Plaza
          </span>
        </Link>

        {/* Desktop navigation - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
          {visibleLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary relative",
                location.pathname === link.href
                  ? "text-primary"
                  : transparent && !scrolled
                    ? "text-white/80 hover:text-white"
                    : "text-muted-foreground",
              )}
            >
              {link.label}
              {link.badge && (
                <span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleToggleNotifications()}
                  className={cn(
                    transparent && !scrolled
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "",
                  )}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-14 z-50 w-80 rounded-lg border bg-card p-3 shadow-card max-h-96 overflow-auto">
                    <p className="mb-2 text-sm font-semibold">Notifications</p>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-md border p-2 mb-2 last:mb-0"
                          onClick={() => handleNotificationClick(item)}
                        >
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.message}
                          </p>
                        </div>
                      ))
                    )}
                    {notifications.length > 0 && (
                      <Button 
                        variant="ghost" 
                        className="w-full mt-2 text-sm"
                        onClick={() => {
                          navigate("/notifications");
                          setShowNotifications(false);
                        }}
                      >
                        View All Notifications
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Icon */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={cn(
                  transparent && !scrolled
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "",
                )}
              >
                <Link to="/payments">
                  <CreditCard className="h-5 w-5" />
                </Link>
              </Button>

              {/* Profile Icon with Dropdown */}
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleProfileClick}
                  className={cn(
                    transparent && !scrolled
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "",
                  )}
                >
                  <User className="h-5 w-5" />
                </Button>
                {/* Profile Dropdown */}
                {showProfile && (
                  <div className="absolute right-0 top-14 z-50 w-48 rounded-lg border bg-card p-2 shadow-card">
                    <Button variant="ghost" className="w-full justify-start text-sm" asChild>
                      <Link to={dashboardHref} onClick={() => setShowProfile(false)}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    {!isAdmin && (
                      <Button variant="ghost" className="w-full justify-start text-sm" asChild>
                        <Link to="/users/me/profile" onClick={() => setShowProfile(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full justify-start text-sm text-destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className={cn(
                  transparent &&
                    !scrolled &&
                    "border border-white text-white hover:bg-white/10",
                )}
              >
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button - right side (visible on mobile only) */}
        <div className="md:hidden flex items-center w-9 justify-end">
          {isLoggedIn && (
            <div className="relative" ref={mobileProfileRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleProfileClick}
                className={cn(
                  "h-9 w-9 relative",
                  transparent && !scrolled ? "text-white" : "",
                )}
              >
                <User className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {showProfile && (
                <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border bg-card p-2 shadow-card">
                  <Button variant="ghost" className="w-full justify-start text-sm" asChild>
                    <Link to={dashboardHref} onClick={() => setShowProfile(false)}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  {!isAdmin && (
                    <Button variant="ghost" className="w-full justify-start text-sm" asChild>
                      <Link to="/users/me/profile" onClick={() => setShowProfile(false)}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full justify-start text-sm" asChild>
                    <Link to="/payments" onClick={() => setShowProfile(false)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payments
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" asChild>
                    <Link to="/notifications" onClick={() => setShowProfile(false)}>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 animate-fade-in">
          <nav className="flex flex-col gap-3">
            {visibleLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
                {link.badge && (
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
            ))}
            {!isLoggedIn && (
              <>
                <hr className="my-2 border-border" />
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
