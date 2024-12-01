import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [basicData, setBasicData] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const hasPro =
    user?.subscription?.tier === "pro" ||
    user?.subscription?.tier === "enterprise";

  useEffect(() => {
    console.log("Current user subscription:", user?.subscription);
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const basicResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/analytics/basic`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const basicResult = await basicResponse.json();
      setBasicData(basicResult.data);

      if (hasPro) {
        const advancedResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/analytics/advanced`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (advancedResponse.ok) {
          const advancedResult = await advancedResponse.json();
          setAdvancedData(advancedResult.data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/subscription/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            priceId: "pro_monthly", // or whatever your price ID is
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
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
                  <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
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
                        upgrade@leeyos.com
                      </span>
                    </li>
                    <li>
                      Set{" "}
                      <span className="font-semibold text-white">
                        {user?.email}
                      </span>{" "}
                      as the subject of your email.
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

  const BlurredOverlay = () => (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
      <div className="text-white text-lg font-semibold mb-2">Pro Feature</div>
      <button
        onClick={() => setIsUpgradeModalOpen(true)}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Upgrade Now
      </button>
    </div>
  );

  if (loading) return <div className="text-white">Loading analytics...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Total Income</h3>
            <p className="text-2xl font-bold text-white">
              ₱{basicData?.total_income?.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Total Expenses</h3>
            <p className="text-2xl font-bold text-white">
              ₱{basicData?.total_expenses?.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Net Savings</h3>
            <p className="text-2xl font-bold text-white">
              -₱
              {Math.abs(
                basicData?.total_income - basicData?.total_expenses
              ).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Savings Rate</h3>
            <p className="text-2xl font-bold text-white">-66.7%</p>
          </div>
        </div>

        {/* Spending Insights - Always visible */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Spending Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm mb-3">Monthly Comparison</h3>
              <p className="text-red-500">
                Entertainment spending increased by 100.0% from last month
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm mb-3">Category Analysis</h3>
              <p className="text-white">
                Higher than usual spending in Entertainment this month
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm mb-3">Unusual Spending</h3>
              <p className="text-red-500">
                Entertainment spending is 100.0% higher than last month
              </p>
              <p className="text-sm text-gray-400 mt-1">Amount: ₱5,000.00</p>
            </div>
          </div>
        </div>

        {/* Pro Features - Always show but blur for free users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 relative">
            <h3 className="text-white text-lg font-semibold mb-4">
              Income vs Expenses
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={advancedData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Bar dataKey="monthly_income" name="Income" fill="#10B981" />
                  <Bar
                    dataKey="monthly_expenses"
                    name="Expenses"
                    fill="#EF4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!hasPro && <BlurredOverlay />}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 relative">
            <h3 className="text-white text-lg font-semibold mb-4">
              Expenses by Category
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ name: "Entertainment", value: 100 }]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#8B5CF6" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {!hasPro && <BlurredOverlay />}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 relative">
          <h3 className="text-white text-lg font-semibold mb-4">
            Income & Expenses Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={advancedData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="monthly_income"
                  name="Income"
                  stroke="#10B981"
                />
                <Line
                  type="monotone"
                  dataKey="monthly_expenses"
                  name="Expenses"
                  stroke="#EF4444"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {!hasPro && <BlurredOverlay />}
        </div>
      </div>

      <UpgradeModal />
    </div>
  );
};

export default Analytics;
