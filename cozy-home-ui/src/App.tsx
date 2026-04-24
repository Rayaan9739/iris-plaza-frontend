import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RoomDetails from "./pages/RoomDetails";
import AuthPage from "./pages/AuthPage";
import BookingFlow from "./pages/BookingFlow";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantRoom from "./pages/tenant/TenantRoom";
import TenantPayments from "./pages/tenant/TenantPayments";
import TenantDocuments from "./pages/tenant/TenantDocuments";
import TenantMaintenance from "./pages/tenant/TenantMaintenance";
import TenantProfile from "./pages/tenant/TenantProfile";
import TenantNotifications from "./pages/tenant/TenantNotifications";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminListings from "./pages/admin/AdminListings";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCancellationRequests from "./pages/admin/AdminCancellationRequests";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminTenantDetails from "./pages/admin/AdminTenantDetails";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import AdminRoomManagement from "./pages/admin/AdminRoomManagement";
import Notifications from "./pages/Notifications";
import {
  clearAuthStorage,
  getAccessToken,
  getCurrentUserRole,
  isTokenExpired,
} from "./lib/auth";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: JSX.Element }) {
  const token = getAccessToken();

  if (!token || isTokenExpired(token)) {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }

  if (getCurrentUserRole() !== "ADMIN") {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }

  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/rooms" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/rooms/:id" element={<RoomDetails />} />
            <Route path="/booking" element={<BookingFlow />} />

            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/admin/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />

            {/* Tenant */}
            <Route path="/users/me" element={<TenantDashboard />} />
            <Route path="/bookings/my-room" element={<TenantRoom />} />
            <Route path="/users/me/payments" element={<TenantPayments />} />
            <Route path="/users/me/documents" element={<TenantDocuments />} />
            <Route path="/users/me/maintenance" element={<TenantMaintenance />} />
            <Route path="/users/me/profile" element={<TenantProfile />} />
            <Route
              path="/users/me/notifications"
              element={<TenantNotifications />}
            />

            {/* Payments - redirect to role-based page */}
            <Route
              path="/payments"
              element={<Navigate to="/users/me/payments" replace />}
            />

            {/* Notifications - standalone page */}
            <Route path="/notifications" element={<Notifications />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/rooms"
              element={
                <AdminRoute>
                  <AdminListings />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <AdminRoute>
                  <AdminBookings />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/cancellation-requests"
              element={
                <AdminRoute>
                  <AdminCancellationRequests />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tenants"
              element={
                <AdminRoute>
                  <AdminTenants />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/room-management"
              element={
                <AdminRoute>
                  <AdminRoomManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tenants/:id"
              element={
                <AdminRoute>
                  <AdminTenantDetails />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/mes"
              element={<Navigate to="/admin/tenants" replace />}
            />
            <Route
              path="/admin/users/msmsmsmes"
              element={<Navigate to="/admin/tenants" replace />}
            />
            <Route
              path="/admin/users/msmsmsmes/:id"
              element={
                <AdminRoute>
                  <AdminTenantDetails />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <AdminRoute>
                  <AdminPayments />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <AdminRoute>
                  <AdminDocuments />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/maintenance"
              element={
                <AdminRoute>
                  <AdminMaintenance />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <Notifications />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
