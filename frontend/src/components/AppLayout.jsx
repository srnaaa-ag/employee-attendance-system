import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { IconMenu } from "./icons/NavIcons.jsx";
import { getRole } from "../services/authService.js";
import "./AppLayout.css";

const routeTitles = {
    "/attendance": "Евиденција",
    "/leave-requests": "Барање за отсуство",
    "/employees": "Вработени",
    "/reports": "Извештаи",
    "/profile": "Мој профил",
};

export default function AppLayout() {
    const { pathname } = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const role = getRole() ?? "EMPLOYEE";
    const isDashboard = pathname === "/dashboard";
    const isAttendance = pathname === "/attendance";
    const useDashHeader = isDashboard || isAttendance;

    const isAdminHeader = role === "ADMIN" || role === "SUPER_ADMIN";
    const title = isDashboard
        ? `Контролна табла - ${isAdminHeader ? "администратор" : "вработен"}`
        : isAttendance
            ? `Евиденција - ${isAdminHeader ? "администратор" : "вработен"}`
            : (routeTitles[pathname] ?? "Барање за корекција");

    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

    return (
        <div className="app-shell">
            <Sidebar
                mobileOpen={mobileNavOpen}
                onMobileClose={() => setMobileNavOpen(false)}
            />
            <div className="app-main">
                <header className={useDashHeader ? "app-header app-header--dash" : "app-header"}>
                    <button
                        type="button"
                        className="app-header__menu"
                        onClick={() => setMobileNavOpen(true)}
                        aria-label="Отвори мени"
                        aria-expanded={mobileNavOpen}
                        aria-controls="app-sidebar-nav"
                    >
                        <IconMenu size={24}/>
                    </button>
                    <h1 className="app-header__title">{title}</h1>
                </header>
                <main className="app-content">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}
