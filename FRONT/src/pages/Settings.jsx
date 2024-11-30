import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ring } from "ldrs";

// Initialize the loader
ring.register();

const Settings = () => {
  const [threshold, setThreshold] = useState("");
  const [currentThreshold, setCurrentThreshold] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Single useEffect for initial fetch
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/threshold`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setCurrentThreshold(data.threshold);
          setThreshold(data.threshold || "");
        }
      } catch (error) {
        console.error("Error fetching threshold:", error);
        setMessage({
          type: "error",
          text: "Failed to load current threshold",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreshold();
  }, []); // Empty dependency array means this only runs once on mount

  const handleUpdateThreshold = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/threshold`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ threshold: threshold || null }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCurrentThreshold(threshold || null);
        setMessage({
          type: "success",
          text: "Threshold updated successfully",
        });
      } else {
        throw new Error(data.message || "Failed to update threshold");
      }
    } catch (error) {
      console.error("Error updating threshold:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update threshold",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveClick = () => {
    setShowWarningModal(true);
  };

  const handleConfirmRemove = async () => {
    setShowWarningModal(false);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/threshold`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ threshold: null }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCurrentThreshold(null);
        setThreshold("");
        setMessage({
          type: "success",
          text: "Threshold alert removed",
        });
      } else {
        throw new Error(data.message || "Failed to remove threshold");
      }
    } catch (error) {
      console.error("Error removing threshold:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to remove threshold",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <l-ring
          size="40"
          stroke="5"
          bg-opacity="0"
          speed="2"
          color="rgb(147, 51, 234)"
        />
        <span className="mt-4 text-gray-400">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-8 border border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          Threshold Settings
        </h2>

        {/* Alert Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center space-x-2 text-sm sm:text-base ${
              message.type === "success"
                ? "bg-green-900/50 border border-green-500/50 text-green-500"
                : "bg-red-900/50 border border-red-500/50 text-red-500"
            }`}
          >
            {message.type === "error" && (
              <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </motion.div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Current Threshold Display */}
          <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
            <h3 className="text-sm sm:text-base text-gray-300 font-medium mb-1 sm:mb-2">
              Current Threshold
            </h3>
            <p className="text-sm sm:text-base text-gray-400">
              {currentThreshold
                ? `Alert when balance falls below ₱${parseFloat(
                    currentThreshold
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "No balance alert set"}
            </p>
          </div>

          {/* Update Threshold Form */}
          <form onSubmit={handleUpdateThreshold} className="space-y-4">
            <div>
              <label
                htmlFor="threshold"
                className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
              >
                Set New Balance Alert
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm sm:text-base">₱</span>
                </div>
                <input
                  type="number"
                  id="threshold"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="pl-8 block w-full px-3 py-2.5 sm:py-3 border border-gray-700 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter amount"
                />
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-400">
                You'll receive an alert when your balance gets close to this
                amount
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Update Alert
              </button>
              {currentThreshold && (
                <button
                  type="button"
                  onClick={handleRemoveClick}
                  disabled={isLoading}
                  className="w-full sm:flex-1 border border-red-500/50 text-red-500 hover:bg-red-500/10 px-4 py-2.5 sm:py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Remove Alert
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 relative"
          >
            <button
              onClick={() => setShowWarningModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6" />
              <h3 className="text-lg font-medium">Remove Alert?</h3>
            </div>

            <p className="text-gray-300 text-sm sm:text-base mb-6">
              Are you sure you want to remove the balance threshold alert? You
              won't receive notifications when your balance gets low.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
              <button
                onClick={handleConfirmRemove}
                className="w-full sm:w-auto sm:flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                Yes, Remove Alert
              </button>
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full sm:w-auto sm:flex-1 border border-gray-600 text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;
