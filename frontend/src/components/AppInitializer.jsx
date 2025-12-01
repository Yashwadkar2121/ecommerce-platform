import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUser } from "../store/slices/authSlice";

const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(loadUser());
    } else {
      // If no token, we still need to set isUserLoaded to true
      // Create a custom action to mark user as loaded without token
      dispatch({ type: 'auth/setUserLoaded' });
    }
  }, [dispatch]);

  return children;
};

export default AppInitializer;