import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

if (import.meta.env.DEV && import.meta.env.VITE_DEV_UI_PREVIEW === "true" && !getToken()) {
    // const raw = import.meta.env.VITE_DEV_UI_ROLE ?? "ADMIN";
    // const role =
    //     raw === "EMPLOYEE" || raw === "ADMIN" || raw === "SUPER_ADMIN" ? raw : "ADMIN";
    setToken("dev-ui-preview");
    // setRole(role);
    // setName(role === "EMPLOYEE" ? "Преглед вработен (dev)" : "Преглед админ (dev)");
    setRole("ADMIN");
    setName("Преглед (dev)");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
