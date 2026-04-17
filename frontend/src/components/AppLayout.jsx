import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header__title">Автоматизиран систем за присуство на вработени</h1>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
