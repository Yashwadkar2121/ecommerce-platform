import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

const Orders = () => {
  // Mock orders data - replace with actual data from your backend
  const orders = [
    {
      id: "ORD-001",
      date: "2024-01-15",
      status: "delivered",
      total: 299.99,
      items: [
        { name: "Wireless Headphones", quantity: 1, price: 199.99 },
        { name: "Phone Case", quantity: 1, price: 29.99 },
      ],
      trackingNumber: "TRK123456789",
    },
    {
      id: "ORD-002",
      date: "2024-01-10",
      status: "shipped",
      total: 159.5,
      items: [{ name: "Smart Watch", quantity: 1, price: 159.5 }],
      trackingNumber: "TRK987654321",
    },
    {
      id: "ORD-003",
      date: "2024-01-05",
      status: "processing",
      total: 75.25,
      items: [
        { name: "USB-C Cable", quantity: 2, price: 25.25 },
        { name: "Power Bank", quantity: 1, price: 49.99 },
      ],
      trackingNumber: null,
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
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

        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Order Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <Package className="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order {order.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {order.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex justify-between items-center py-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.name}
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
              </div>

              {/* Order Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm text-gray-600">
                      {order.trackingNumber ? (
                        <>Tracking: {order.trackingNumber}</>
                      ) : (
                        "Tracking number will be provided when shipped"
                      )}
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                      View Details
                    </button>
                    {order.status === "delivered" && (
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                        Buy Again
                      </button>
                    )}
                    {order.status === "shipped" && (
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                        Track Package
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {orders.length === 0 && (
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
            <button
              onClick={() => (window.location.href = "/products")}
              className="bg-primary-600 text-black px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Start Shopping
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Orders;
