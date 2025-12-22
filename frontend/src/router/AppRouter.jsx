// FINAL AppRouter.jsx - Production Ready
import { Routes, Route } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import Orders from "../pages/Orders";
import ForgotPassword from "../components/Forget-Password/ForgotPassword";
import VerifyOTP from "../components/Forget-Password/VerifyOTP";
import ResetPassword from "../components/Forget-Password/ResetPassword";
import NotFound from "../pages/NotFound.Jsx";

const AppRouter = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Root path shows products */}
          <Route path="/" element={<Products />} />

          {/* Product details */}
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Cart & Checkout */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Account */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />

          {/* Password Recovery */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default AppRouter;
