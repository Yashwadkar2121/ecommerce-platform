import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { store } from "./store/index.js";
import { hydrateCart } from "./store/cartSync.js";
import { logout } from "./store/slices/authSlice.js";
import "./index.css";

// load saved cart if already logged in
if (localStorage.getItem("token")) {
  store.dispatch(hydrateCart());
}

// fired from api.js when the refresh token expires
window.addEventListener("authTokenExpired", () => store.dispatch(logout()));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
