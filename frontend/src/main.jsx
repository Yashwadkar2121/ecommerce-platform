import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { store } from "./store/index.js";
import { hydrateCart } from "./store/cartSync.js";
<<<<<<< HEAD
import { logout } from "./store/slices/authSlice.js";
import "./index.css";

// Restore the saved cart for a user who is already logged in
if (localStorage.getItem("token")) {
=======
import { logout, loadUser } from "./store/slices/authSlice.js";
import "./index.css";

// A user who is already logged in: load their profile (needed for the admin
// link) and restore their saved cart
if (localStorage.getItem("token")) {
  store.dispatch(loadUser());
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
  store.dispatch(hydrateCart());
}

// api.js fires this when the refresh token is no longer valid
window.addEventListener("authTokenExpired", () => store.dispatch(logout()));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
