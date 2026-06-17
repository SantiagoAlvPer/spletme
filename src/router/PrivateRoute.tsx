import { Navigate, Outlet } from "react-router-dom";

function isAuthenticated(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    return Boolean(user?.id || user?._id);
  } catch {
    return false;
  }
}

export default function PrivateRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/auth/email-login" replace />;
  }
  return <Outlet />;
}
