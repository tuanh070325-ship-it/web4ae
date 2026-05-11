import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function AdminRoute() {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#111216] py-24 text-center text-zinc-400">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
