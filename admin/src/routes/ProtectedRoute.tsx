import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { AdminLayout } from "../components/layout/AdminLayout";

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};
