import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { getRole } from "../services/authService.js";
import "./AppLayout.css";

const routeTitles = {
  "/attendance": "Евиденција",
  "/leave-requests": "Барање за отсуство",
  "/employees": "Вработени",
  "/reports": "Извештаи",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const role = getRole() ?? "employee";
  const isDashboard = pathname === "/dashboard";
  const isAttendance = pathname === "/attendance";
  const useDashHeader = isDashboard || isAttendance;

  const title = isDashboard
    ? `Контролна табла - ${role === "ADMIN" ? "администратор" : "вработен"}`
    : isAttendance
      ? `Евиденција - ${role === "ADMIN" ? "администратор" : "вработен"}`
      : (routeTitles[pathname] ?? "Систем за присуство");

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className={useDashHeader ? "app-header app-header--dash" : "app-header"}>
          <h1 className="app-header__title">{title}</h1>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
