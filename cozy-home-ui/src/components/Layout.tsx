import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { isAuthenticated } from "@/lib/auth";

export function Layout() {
  const location = useLocation();
  const pathname = location.pathname;
  const hideNavbar = pathname === "/login" || pathname === "/admin/login";
  const transparent = pathname === "/";
  const contentClassName = hideNavbar ? "" : transparent ? "" : "pt-16";

  return (
    <div className="min-h-screen bg-background">
      {!hideNavbar && (
        <Navbar transparent={transparent} isLoggedIn={isAuthenticated()} />
      )}
      <main className={contentClassName}>
        <Outlet />
      </main>
      {!hideNavbar && (
        <footer className="border-t bg-card">
          <div className="container py-6 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Iris Plaza
          </div>
        </footer>
      )}
    </div>
  );
}
