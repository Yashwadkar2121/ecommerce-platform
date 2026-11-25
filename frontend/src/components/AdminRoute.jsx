import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "../store/hooks";

// Only lets admins in. The profile is loaded at app start (main.jsx), so right
// after a page refresh `user` is briefly empty - show a spinner, not a redirect.
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!user) {
    return (
      <div className="flex justify-center py-24" role="status" aria-label="Loading">
        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default AdminRoute;
