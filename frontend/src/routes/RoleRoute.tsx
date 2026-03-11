import { Navigate, Outlet } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import type { UserRole } from "../types/auth";

type Props = {
  allowedRole: UserRole;
};

export default function RoleRoute({ allowedRole }: Props) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === "Manager" ? "/manager" : "/employee"} replace />;
  }

  return <Outlet />;
}