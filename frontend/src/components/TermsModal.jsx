import { motion } from "framer-motion";

const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-11/12 md:w-2/3 lg:w-1/2 rounded-xl shadow-lg p-6 overflow-y-auto max-h-[80vh]"
      >
        <h2 className="text-2xl font-bold mb-4">Terms & Conditions</h2>

        <div className="space-y-2 text-gray-600 text-sm">
          <p>
            • This e-commerce website is for personal and non-commercial use.
          </p>
          <p>• Users must provide accurate information during registration.</p>
          <p>• Orders once placed cannot be cancelled after processing.</p>
          <p>
            • Payments must be made through authorized payment gateways only.
          </p>
          <p>
            • The company is not responsible for delays caused by courier
            partners.
          </p>
          <p>
            • All disputes fall under the jurisdiction of the respective state’s
            courts.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

export default TermsModal;
