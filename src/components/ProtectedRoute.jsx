import { Navigate } from "react-router-dom";
import { getUser } from "../lib/auth";

export default function ProtectedRoute({ roles, children }) {
  const user = getUser();

  if (!user) return <Navigate to="/login" replace />;

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
