import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedLayout from "./components/ProtectedLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Attendance from "./pages/Attendance.jsx";
import LeaveRequests from "./pages/LeaveRequests.jsx";
import Employees from "./pages/Employees.jsx";
import Reports from "./pages/Reports.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import CorrectionRequests from "./pages/CorrectionRequests.jsx";
import { isAuthenticated } from "./services/authService.js";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leave-requests" element={<LeaveRequests />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedLayout />}>
            <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/leave-requests" element={<LeaveRequests />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/correction-requests" element={<CorrectionRequests />} />
            </Route>
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}/>
    </Routes>
  );
}
