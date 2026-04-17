import { Navigate } from "react-router-dom";
import { getRole } from "../services/authService.js";
import "./Page.css";

export default function Employees() {
  if (getRole() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (    <div className="page">
      <h2 className="page__title">Вработени</h2>
      <p className="page__lead">Placeholder: листа и управување со вработени.</p>
    </div>
  );
}
