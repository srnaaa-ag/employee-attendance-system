import { Navigate } from "react-router-dom";
import { IconCsv } from "../components/icons/NavIcons.jsx";
import { getRole } from "../services/authService.js";
import "./Page.css";

export default function Reports() {
  if (getRole() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (    <div className="page">
      <h2 className="page__title page__title--row">
        <IconCsv size={28} className="page__title-icon" aria-hidden />
        Извештаи
      </h2>
      <p className="page__lead">Placeholder: филтри и извоз (CSV) на извештаи.</p>
    </div>
  );
}
