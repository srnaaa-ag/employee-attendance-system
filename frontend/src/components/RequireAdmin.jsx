import { Navigate, Outlet } from "react-router-dom";
import { isAdmin } from "../services/authService.js";

export default function RequireAdmin() {
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
