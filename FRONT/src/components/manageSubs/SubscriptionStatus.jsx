import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const SubscriptionStatus = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/subscriptions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const getStatusBadge = () => {
    const statusColors = {
      active: "bg-green-500/20 text-green-400 border-green-500/50",
      awaiting_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      free: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      payment_failed: "bg-red-500/20 text-red-400 border-red-500/50",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm border ${
          statusColors[subscription?.tier_status || "free"]
        }`}
      >
        {subscription?.tier_status?.replace("_", " ").toUpperCase() || "FREE"}
      </span>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-8 border border-gray-700">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold text-white">Subscription Status</h2>
        {getStatusBadge()}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-700">
          <span className="text-gray-400">Current Plan</span>
          <span className="text-white font-medium capitalize">
            {subscription?.tier || "Free"}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-700">
          <span className="text-gray-400">Start Date</span>
          <span className="text-white">
            {subscription?.start_date
              ? new Date(subscription.start_date).toLocaleDateString()
              : "N/A"}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-700">
          <span className="text-gray-400">Next Payment</span>
          <span className="text-white">
            {subscription?.end_date
              ? new Date(subscription.end_date).toLocaleDateString()
              : "N/A"}
          </span>
        </div>

        {subscription?.tier_status === "awaiting_payment" && (
          <div className="mt-6">
            <Link
              to="/payment"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Complete Payment
            </Link>
          </div>
        )}

        {subscription?.tier_status === "free" && (
          <div className="mt-6">
            <Link
              to="/pricing"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
