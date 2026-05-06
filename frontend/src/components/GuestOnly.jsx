import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../services/authService.js";

export default function GuestOnly() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
