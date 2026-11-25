import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { orderService } from "../services/orderService";

const STATUS = {
  pending: {
    label: "Awaiting payment",
    icon: <CreditCard className="h-5 w-5 text-gray-500" />,
    color: "bg-gray-100 text-gray-800",
  },
  processing: {
    label: "Processing",
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
    color: "bg-yellow-100 text-yellow-800",
  },
  shipped: {
    label: "Shipped",
    icon: <Truck className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-100 text-blue-800",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    color: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    color: "bg-red-100 text-red-800",
  },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let active = true;
    orderService
      .getOrders()
      .then(({ data }) => active && setOrders(data.orders || []))
      .catch(
        (err) =>
          active &&
          setError(err?.response?.data?.error || "Failed to load your orders."),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    setCancellingId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
      );
    } catch (err) {
      setError(err?.response?.data?.error || "Could not cancel the order.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">
            View your order history and track shipments
          </p>
        </div>

        {error && (
          <p className="mb-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order, index) => {
            const status = STATUS[order.status] || STATUS.pending;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                      <Package className="h-6 w-6 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 space-y-3">
                  {order.items.map((item, i) => (
                    <div
                      key={`${item.productId}-${i}`}
                      className="flex justify-between items-center py-2"
                    >
                      <div className="flex items-center space-x-3">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.product?.name ||
                              "Product no longer available"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {status.icon}
                      <span className="text-sm text-gray-600">
                        {order.Payment?.paymentMethod
                          ? `Paid via ${order.Payment.paymentMethod}`
                          : "Payment pending"}
                      </span>
                    </div>
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                      >
                        {cancellingId === order.id
                          ? "Cancelling..."
                          : "Cancel order"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {!loading && !error && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your
              order history here.
            </p>
            <Link
              to="/"
              className="bg-primary-600 text-black px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Start Shopping
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Orders;
