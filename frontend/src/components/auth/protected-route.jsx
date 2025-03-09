// src/components/auth/protected-route.jsx
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useLocation } from "react-router-dom";
import LoadingScreen from "../ui/loading-screen";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;