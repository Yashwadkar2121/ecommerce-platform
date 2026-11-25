import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

// Sends visitors who aren't logged in to /login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

export default ProtectedRoute;
