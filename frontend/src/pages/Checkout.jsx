import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, CheckCircle, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { clearCart } from "../store/slices/cartSlice";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { TAX_RATE } from "../config/pricing";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent";

const SHIPPING_FIELDS = [
  ["firstName", "First Name"],
  ["lastName", "Last Name"],
  ["address", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["zipCode", "ZIP Code"],
  ["country", "Country"],
];

const errorMessage = (err, fallback) =>
  err?.response?.data?.error || err?.message || fallback;

// Load Stripe.js once, using the publishable key served by the backend
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = paymentService
      .getConfig()
      .then(({ data }) => loadStripe(data.stripePublishableKey))
      .catch((err) => {
        stripePromise = null; // allow a retry
        throw err;
      });
  }
  return stripePromise;
};

// Rendered inside <Elements>. Card details go straight to Stripe and never
// touch our server or React state.
const PaymentForm = ({ onPaid, onBack, disabled }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      await onPaid(paymentIntent.id); // parent moves to the confirmation step
    } else {
      setError(`Payment is ${paymentIntent?.status || "not complete"}. Please try again.`);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-2 text-gray-600">
        <Lock size={16} />
        <span className="text-sm">Payments are processed securely by Stripe</span>
      </div>

      <PaymentElement />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting || disabled}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:border-primary-600 hover:text-primary-600 transition-colors font-semibold disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting || disabled}
          className="flex-1 bg-primary-600 text-black py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : "Pay now"}
        </button>
      </div>
    </form>
  );
};

const Checkout = () => {
  const dispatch = useAppDispatch();
  const { items, total } = useAppSelector((state) => state.cart);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [order, setOrder] = useState(null); // server-side order + totals
  const [clientSecret, setClientSecret] = useState("");
  const [stripeInstance, setStripeInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paidOrder, setPaidOrder] = useState(null);

  // Pre-fill the email once the profile is available
  useEffect(() => {
    if (user?.email) {
      setShipping((prev) => (prev.email ? prev : { ...prev, email: user.email }));
    }
  }, [user]);

  const handleInputChange = (e) =>
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Estimate until the server has priced the order
  const estimatedTax = Math.round(total * TAX_RATE * 100) / 100;
  const summary = order
    ? { subtotal: order.subtotal, tax: order.tax, total: order.total }
    : { subtotal: total, tax: estimatedTax, total: total + estimatedTax };

  // Step 1 -> 2: create the order (server prices it + reserves stock), then a
  // Stripe PaymentIntent for exactly that amount.
  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let createdOrderId = null;
    try {
      const { data: orderData } = await orderService.createOrder({
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        shippingAddress: shipping,
        paymentMethod: "stripe",
      });
      createdOrderId = orderData.order.id;

      const { data: intent } = await paymentService.createIntent(createdOrderId);
      const stripe = await getStripe();

      setOrder(orderData.order);
      setClientSecret(intent.clientSecret);
      setStripeInstance(stripe);
      setStep(2);
    } catch (err) {
      // Don't leave stock reserved for an order that can't be paid
      if (createdOrderId) {
        orderService.cancelOrder(createdOrderId).catch(() => {});
      }
      setError(errorMessage(err, "Could not start checkout. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Going back to edit the address: cancel the unpaid order (stock is released)
  const handleBack = async () => {
    if (order) {
      setLoading(true);
      try {
        await orderService.cancelOrder(order.id);
      } catch {
        /* already cancelled or paid - nothing more to do here */
      } finally {
        setLoading(false);
      }
    }
    setOrder(null);
    setClientSecret("");
    setError("");
    setStep(1);
  };

  // Called by <PaymentForm> after Stripe says the payment succeeded
  const handlePaid = async (paymentIntentId) => {
    try {
      await paymentService.confirm(order.id, paymentIntentId);
      setPaidOrder({ ...order, status: "processing" });
      dispatch(clearCart());
      setStep(3);
    } catch (err) {
      // The money was taken; Stripe's webhook will finish the order.
      setError(
        `${errorMessage(err, "We could not confirm your payment yet.")} Your card was charged - please check "My Orders" in a minute.`
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to checkout
          </h1>
          <Link to="/login" className="text-primary-600 font-medium">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-4">
            Add some items to your cart before checking out.
          </p>
          <Link to="/" className="text-primary-600 font-medium">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step >= stepNumber
                      ? "bg-primary-600 border-primary-600 text-black"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  {step > stepNumber ? <CheckCircle size={20} /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > stepNumber ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Shipping Information
                </h2>

                <form onSubmit={handleContinueToPayment} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={shipping.email}
                      onChange={handleInputChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SHIPPING_FIELDS.map(([name, label]) => (
                      <div
                        key={name}
                        className={name === "address" ? "md:col-span-2" : ""}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {label}
                        </label>
                        <input
                          type="text"
                          name={name}
                          value={shipping[name]}
                          onChange={handleInputChange}
                          className={inputClass}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 text-black py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Continue to Payment"
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && clientSecret && stripeInstance && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Payment
                </h2>

                <Elements stripe={stripeInstance} options={{ clientSecret }}>
                  <PaymentForm
                    onPaid={handlePaid}
                    onBack={handleBack}
                    disabled={loading}
                  />
                </Elements>

                {error && (
                  <p className="text-sm text-red-600 mt-4" role="alert">
                    {error}
                  </p>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md p-8 text-center"
              >
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Order Confirmed!
                </h2>
                <p className="text-gray-600 mb-2">
                  Thank you for your purchase. Order #{paidOrder?.id} has been
                  paid and will be shipped soon.
                </p>
                <p className="text-gray-900 font-semibold mb-6">
                  Total paid: ${paidOrder?.total.toFixed(2)}
                </p>
                <div className="flex justify-center space-x-4">
                  <Link
                    to="/orders"
                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:border-primary-600 transition-colors font-semibold"
                  >
                    View my orders
                  </Link>
                  <Link
                    to="/"
                    className="bg-primary-600 text-black px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          {step !== 3 && (
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6 sticky top-8"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image || "/api/placeholder/50/50"}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax{order ? "" : " (estimated)"}</span>
                    <span>${summary.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span className="text-primary-600">
                      ${summary.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
