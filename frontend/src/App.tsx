import { CssBaseline } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import StoreDashboardPage from "./pages/StoreDashboardPage";
import EmployeeAvailabilityPage from "./pages/EmployeeAvailabilityPage";

export default function App() {
  return (
    <>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRole="Manager" />}>
            <Route path="/manager" element={<ManagerDashboardPage />} />
            <Route path="/manager/stores/:storeId" element={<StoreDashboardPage />} />
          </Route>

          <Route element={<RoleRoute allowedRole="Employee" />}>
            <Route path="/employee" element={<EmployeeDashboardPage />} />
            <Route
            path="/employee/stores/:storeId/availability/:rosterWeekId"
            element={<EmployeeAvailabilityPage />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}