import React, { useState } from "react";
import PayPalButton from "../components/payments/PaypalButton";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₱0",
    period: "/month",
    features: [
      "Basic Expense Tracking",
      "Monthly Summary Analytics",
      "Up to 3 Months History",
      "Basic Categories",
    ],
    buttonText: "Current Plan",
  },
  {
    name: "Pro",
    price: "₱299",
    period: "/month",
    features: [
      "Unlimited History",
      "Advanced Analytics & Reports",
      "Custom Categories & Tags",
      "Budget Goals & Alerts",
      "Data Export (CSV/PDF)",
      "Priority Support",
    ],
    popular: true,
    buttonText: "Upgrade Now",
  },
  {
    name: "Enterprise",
    price: "₱999",
    period: "/month",
    features: [
      "Everything in Pro",
      "Multiple Users",
      "Team Collaboration",
      "Custom Branding",
      "API Access",
      "Dedicated Support",
      "Custom Features",
    ],
    buttonText: "Coming Soon",
  },
];

const Upgrade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user's current plan
  const currentPlan = user?.subscription?.tier || "free";

  // Helper function to determine if this is the user's current plan
  const isCurrentPlan = (planName) => {
    return currentPlan.toLowerCase() === planName.toLowerCase();
  };

  // Helper function to determine if upgrade is needed
  const needsUpgrade = (planName) => {
    const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
    return (
      planHierarchy[planName.toLowerCase()] >
      planHierarchy[currentPlan.toLowerCase()]
    );
  };

  const handlePayPalSuccess = async (paymentDetails) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/payments/verify-paypal-upgrade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            orderID: paymentDetails.id,
            paymentDetails: paymentDetails,
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        navigate("/dashboard", {
          state: {
            message:
              "Thank you for purchasing! You are now a Pro user. Enjoy features like Unlimited History, Advanced Analytics & Reports, Custom Categories & Tags, and more.",
          },
        });
      } else {
        alert(data.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      alert("An error occurred during payment verification");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {isProcessing && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-xl shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-white mt-4 text-lg font-medium">
              Processing your payment...
            </p>
            <p className="text-gray-400 mt-2">Please don't close this window</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Select the perfect plan for your needs. Upgrade anytime to unlock
            more features and enhance your financial management experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-gray-800 rounded-xl shadow-xl p-8 ${
                plan.popular ? "ring-2 ring-purple-500" : ""
              } ${selectedPlan === plan.name ? "ring-2 ring-purple-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">
                  {plan.name}
                </h3>
                <div className="mt-4 flex justify-center items-baseline">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <svg
                      className="h-5 w-5 text-green-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isCurrentPlan(plan.name) ? (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : plan.name === "Enterprise" ? (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ) : needsUpgrade(plan.name) ? (
                  <button
                    onClick={() => setSelectedPlan(plan.name)}
                    className={`w-full px-6 py-3 rounded-lg transition-colors ${
                      selectedPlan === plan.name
                        ? "bg-purple-700 text-white"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    Select Plan
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    Not Available
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedPlan === "Pro" && (
          <div className="mt-16 max-w-xl mx-auto">
            <div className="bg-gray-800 rounded-xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Complete Your Upgrade
              </h2>
              <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-300">Selected Plan:</span>
                  <span className="text-white font-semibold">Pro Plan</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-white font-semibold">₱299.00</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <PayPalButton
                  amount="299.00"
                  onSuccess={handlePayPalSuccess}
                  onCancel={() => {
                    setSelectedPlan(null);
                    navigate("/goals");
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-gray-400">
          <p className="text-sm">
            Need help choosing? Contact our support team at{" "}
            <a
              href="mailto:support@example.com"
              className="text-purple-400 hover:text-purple-300"
            >
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Upgrade;
