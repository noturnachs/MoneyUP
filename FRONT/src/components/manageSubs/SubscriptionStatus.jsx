import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const SubscriptionStatus = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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

  const UpgradeModal = () => (
    <Transition appear show={isUpgradeModalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => setIsUpgradeModalOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white mb-4"
                >
                  Upgrade to Pro Plan
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-gray-300 mb-4">
                    To upgrade to our Pro plan, please follow these steps:
                  </p>
                  <ol className="list-decimal list-inside text-gray-300 space-y-2">
                    <li>
                      Send ₱299 via GCash to:{" "}
                      <span className="font-semibold text-white">
                        09062130621
                      </span>
                    </li>
                    <li>Take a screenshot of your payment</li>
                    <li>
                      Send the screenshot to:{" "}
                      <span className="font-semibold text-white">
                        support@example.com
                      </span>
                    </li>
                    <li>
                      Include your email:{" "}
                      <span className="font-semibold text-white">
                        {user?.email}
                      </span>
                    </li>
                  </ol>
                  <p className="mt-4 text-sm text-gray-400">
                    We'll upgrade your account within 24 hours after payment
                    verification.
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    onClick={() => setIsUpgradeModalOpen(false)}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  return (
    <>
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
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>
      <UpgradeModal />
    </>
  );
};

export default SubscriptionStatus;
