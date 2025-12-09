import Navbar from "./Navbar";
import Footer from "./Footer";
import CartNotification from "../CartNotification/CartNotification";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Cart Notifications - appears on all pages */}
      <CartNotification />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
