import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ring } from "ldrs";

// Initialize the loader (needs to be done once)
ring.register();

const timestamp = new Date();

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const calculateFinancialProfile = (balanceData, recentTransactions) => {
  // Check if there's enough data (at least 5 transactions each)
  const incomeTransactions = recentTransactions.filter(
    (t) => t.type === "income"
  );
  const expenseTransactions = recentTransactions.filter(
    (t) => t.type === "expense"
  );

  if (incomeTransactions.length < 5 || expenseTransactions.length < 5) {
    return null;
  }

  // Calculate savings rate
  const totalIncome = balanceData.totalBalance || 0;
  const totalExpenses = balanceData.monthlyExpenses || 0;
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Calculate expense patterns
  const expenseCategories = recentTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category_name] = (acc[t.category_name] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

  // Determine financial profile
  let profile = {
    type: "",
    description: "",
    tips: [],
  };

  if (savingsRate >= 30) {
    profile.type = "Super Saver";
    profile.description = "You have excellent saving habits!";
    profile.tips = [
      "Consider investing your surplus",
      "Keep maintaining your savings discipline",
    ];
  } else if (savingsRate >= 20) {
    profile.type = "Smart Saver";
    profile.description = "You have good saving habits";
    profile.tips = [
      "Try to increase savings by 5%",
      "Look for additional income sources",
    ];
  } else if (savingsRate >= 10) {
    profile.type = "Cautious Spender";
    profile.description = "You save, but there's room for improvement";
    profile.tips = [
      "Track your discretionary spending",
      "Set up automatic savings",
    ];
  } else {
    profile.type = "Active Spender";
    profile.description = "Consider building your savings";
    profile.tips = ["Create a budget", "Find areas to reduce expenses"];
  }

  return {
    profile,
    savingsRate,
    expenseCategories,
  };
};

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [hasData, setHasData] = useState(false);
  const [step, setStep] = useState(1);
  const [initialBalance, setInitialBalance] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [balanceData, setBalanceData] = useState({
    totalBalance: 0,
    currentBalance: 0,
    monthlyExpenses: 0,
    expenseChange: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [balanceChanges, setBalanceChanges] = useState({
    totalChange: 0,
    currentChange: 0,
    lastChangeDate: null,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [showThresholdAlert, setShowThresholdAlert] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5);
  const [sortOrder, setSortOrder] = useState("latest");
  const [filterType, setFilterType] = useState("all");
  const [financialProfile, setFinancialProfile] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Refresh user data when the component mounts
    refreshUser();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
    }
  }, [location.state]);

  const handleThresholdSubmit = async (thresholdValue) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/threshold`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ threshold: thresholdValue || null }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update threshold");
      }

      return true;
    } catch (error) {
      console.error("Error updating threshold:", error);
      return false;
    }
  };

  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (!initialBalance || !selectedCategory) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const now = new Date();
      const isoTime = now.toISOString();

      const response = await fetch(`${process.env.REACT_APP_API_URL}/income`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: initialBalance,
          description: "Initial Balance",
          category_id: selectedCategory,
          created_at: isoTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set initial balance");
      }

      if (threshold) {
        const thresholdSuccess = await handleThresholdSubmit(threshold);
        if (!thresholdSuccess) {
          console.error("Failed to set threshold, but initial balance was set");
        }
      }

      setStep(3);
      setTimeout(() => {
        setHasData(true);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error during initial setup:", error);
      alert("There was an error setting up your account. Please try again.");
    }
  };

  const fetchPrimaryGoal = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/goals/primary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        const activeGoal = data.goals.find((goal) => !goal.is_completed);
        setPrimaryGoal(activeGoal || null);
      }
    } catch (error) {
      console.error("Error fetching primary goal:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // First check if user has any data
        const [incomeResponse, thresholdResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/income`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch(`${process.env.REACT_APP_API_URL}/auth/threshold`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

        const [incomeData, thresholdData] = await Promise.all([
          incomeResponse.json(),
          thresholdResponse.json(),
        ]);

        const userHasData = incomeData.incomes && incomeData.incomes.length > 0;
        setHasData(userHasData);

        if (thresholdData.success) {
          setThreshold(thresholdData.threshold || "");
        }

        if (!userHasData) {
          // Only fetch categories for initial setup
          const categoriesResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/categories/type/income`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        } else {
          // Fetch dashboard data if user has transactions
          const [
            incomeTotalRes,
            expenseRes,
            goalRes,
            recentIncomeRes,
            recentExpenseRes,
          ] = await Promise.all([
            fetch(`${process.env.REACT_APP_API_URL}/income/total`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
            fetch(`${process.env.REACT_APP_API_URL}/expenses/total`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
            fetch(`${process.env.REACT_APP_API_URL}/goals/primary`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
            fetch(`${process.env.REACT_APP_API_URL}/income/recent`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
            fetch(`${process.env.REACT_APP_API_URL}/expenses/recent`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
          ]);

          const [
            incomeTotalData,
            expenseData,
            goalData,
            recentIncome,
            recentExpense,
          ] = await Promise.all([
            incomeTotalRes.json(),
            expenseRes.json(),
            goalRes.json(),
            recentIncomeRes.json(),
            recentExpenseRes.json(),
          ]);

          const totalIncome = parseFloat(incomeTotalData.total || 0);
          const totalExpenses = parseFloat(expenseData.total || 0);

          setBalanceData({
            totalBalance: totalIncome,
            currentBalance: totalIncome - totalExpenses,
            monthlyExpenses: totalExpenses,
            expenseChange: 0,
          });

          if (goalData.success) {
            setPrimaryGoal(goalData.goal);
          }

          const allTransactions = [
            ...(recentIncome.incomes || []).map((income) => ({
              ...income,
              type: "income",
              amount: parseFloat(income.amount),
            })),
            ...(recentExpense.expenses || []).map((expense) => ({
              ...expense,
              type: "expense",
              amount: parseFloat(expense.amount),
            })),
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setRecentTransactions(allTransactions);

          if (allTransactions.length > 0) {
            const latest = allTransactions[0];
            setBalanceChanges({
              totalChange: latest.type === "income" ? latest.amount : 0,
              currentChange:
                latest.type === "income" ? latest.amount : -latest.amount,
              lastChangeDate: latest.created_at,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 200);
      }
    };

    fetchAllData();
  }, []); // Empty dependency array since we only want this to run once on mount

  useEffect(() => {
    if (threshold && balanceData?.currentBalance) {
      const thresholdValue = parseFloat(threshold);
      const currentBalance = balanceData.currentBalance;
      const warningThreshold = thresholdValue * 1.2; // 20% above threshold

      // Show alert if balance is below threshold or within 20% of threshold
      setShowThresholdAlert(
        currentBalance <= warningThreshold && currentBalance > 0
      );
    } else {
      setShowThresholdAlert(false);
    }
  }, [threshold, balanceData?.currentBalance]);

  useEffect(() => {
    if (balanceData && recentTransactions.length > 0) {
      const profile = calculateFinancialProfile(
        balanceData,
        recentTransactions
      );
      setFinancialProfile(profile);
    }
  }, [balanceData, recentTransactions]);

  const Pagination = ({
    totalItems,
    itemsPerPage,
    currentPage,
    setCurrentPage,
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-gray-400">
          Showing 1 to {Math.min(itemsPerPage, totalItems)} of {totalItems}{" "}
          results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-white disabled:text-gray-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setCurrentPage(idx + 1)}
              className={`w-8 h-8 rounded-md text-sm font-medium transition-colors
                ${
                  currentPage === idx + 1
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-white disabled:text-gray-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const getFilteredTransactions = () => {
    let filtered = [...recentTransactions];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
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
        <span className="mt-4 text-gray-400">Loading your dashboard...</span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-white">
                  Welcome to MoneyUp! 🎉
                </h1>
                <p className="text-xl font-medium text-purple-400">
                  Hi {user.username}, we're excited to help you manage your
                  finances!
                </p>
                <p className="text-gray-300">
                  Let's get you set up in just a few seconds. We'll help you:
                </p>
              </div>

              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-center space-x-3 text-gray-200">
                  <CheckCircleIcon className="h-6 w-6 text-purple-500" />
                  <span>Track your income and expenses</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-200">
                  <CheckCircleIcon className="h-6 w-6 text-purple-500" />
                  <span>Visualize your spending patterns</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-200">
                  <CheckCircleIcon className="h-6 w-6 text-purple-500" />
                  <span>Achieve your financial goals</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-8 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Let's Get Started →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  What's your current balance?
                </h2>
                <p className="text-gray-300">
                  This helps us give you accurate insights about your finances.
                </p>
              </div>

              <form
                onSubmit={handleInitialSetup}
                className="max-w-md mx-auto space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">₱</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      className="pl-8 appearance-none block w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      placeholder="0.00"
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    required
                    className="block w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option
                        key={category.category_id}
                        value={category.category_id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">₱</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="pl-8 appearance-none block w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      placeholder="Set minimum balance alert (optional)"
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    We'll alert you when your balance gets close to this amount
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Continue →
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-white">You're all set!</h2>
              <p className="text-gray-300">
                Preparing your personalized dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular dashboard view when user has data
  return (
    <div
      className={`space-y-6 transition-all duration-500 ease-in-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <svg
              className="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-green-400">
                {location.state?.message}
              </p>
              <p className="text-sm text-green-300 mt-1">
                Enjoy features like:
                <ul className="list-disc list-inside mt-1 ml-2">
                  <li>Unlimited History</li>
                  <li>Advanced Analytics & Reports</li>
                  <li>Custom Categories & Tags</li>
                  <li>Budget Goals & Alerts</li>
                  <li>Data Export (CSV/PDF)</li>
                  <li>Priority Support</li>
                </ul>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-400 hover:text-green-300 self-start"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-800 p-3 sm:p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-xs sm:text-sm font-medium">
            Net Savings
          </h3>
          <div className="mt-2 space-y-1">
            <p className="text-lg sm:text-2xl font-bold text-green-500">
              ₱
              {(balanceData?.totalBalance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {balanceChanges?.totalChange !== 0 && (
              <div className="flex items-center text-xs sm:text-sm text-green-500">
                <span>
                  +₱
                  {(balanceChanges.totalChange || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-xs sm:text-sm font-medium">
            Current Balance
          </h3>
          <div className="mt-2 space-y-1">
            <p
              className={`text-lg sm:text-2xl font-bold ${
                threshold && balanceData?.currentBalance
                  ? balanceData.currentBalance <= parseFloat(threshold) * 1.1 &&
                    balanceData.currentBalance > parseFloat(threshold)
                    ? "text-orange-500" // Near threshold (within 10%)
                    : balanceData.currentBalance <= parseFloat(threshold)
                    ? "text-red-600" // Below threshold
                    : "text-white" // Above threshold
                  : "text-white" // No threshold set
              }`}
            >
              ₱
              {(balanceData?.currentBalance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {balanceChanges?.currentChange !== 0 && (
              <div
                className={`flex items-center text-xs sm:text-sm ${
                  balanceChanges.currentChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                <span>
                  {balanceChanges.currentChange > 0 ? "" : "↓"}
                  {balanceChanges.currentChange > 0 ? "+" : "-"}₱
                  {(Math.abs(balanceChanges.currentChange) || 0).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
                {balanceChanges.lastChangeDate && (
                  <span className="text-gray-400 ml-2 text-xs">
                    {new Date(balanceChanges.lastChangeDate).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: userTimezone,
                      }
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-xs sm:text-sm font-medium">
            Total Expenses
          </h3>
          <div className="mt-2 space-y-1">
            <p className="text-lg sm:text-2xl font-bold text-red-500">
              ₱
              {(balanceData?.monthlyExpenses || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {balanceData?.expenseChange !== 0 && (
              <div
                className={`flex items-center text-xs sm:text-sm ${
                  balanceData?.expenseChange > 0
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                <span>
                  {balanceData?.expenseChange > 0 ? "" : "↓"}
                  {Math.abs(balanceData?.expenseChange || 0).toFixed(1)}%
                </span>
                <span className="text-gray-400 ml-2">from last month</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Threshold Alert */}
      {showThresholdAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-xl p-4 flex items-center justify-between ${
            balanceData.currentBalance <= parseFloat(threshold)
              ? "bg-red-900/30 border-red-500/30" // Below threshold
              : "bg-orange-900/30 border-orange-500/30" // Close to threshold
          }`}
        >
          <div className="flex items-center space-x-3">
            <svg
              className={`h-6 w-6 ${
                balanceData.currentBalance <= parseFloat(threshold)
                  ? "text-red-400"
                  : "text-orange-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p
                className={`font-medium ${
                  balanceData.currentBalance <= parseFloat(threshold)
                    ? "text-red-400"
                    : "text-orange-400"
                }`}
              >
                {balanceData.currentBalance <= parseFloat(threshold)
                  ? "Low Balance Warning"
                  : "Balance Alert"}
              </p>
              <p
                className={`text-sm ${
                  balanceData.currentBalance <= parseFloat(threshold)
                    ? "text-red-300"
                    : "text-orange-300"
                }`}
              >
                {balanceData.currentBalance <= parseFloat(threshold)
                  ? `Your balance has fallen below your minimum threshold of ₱${parseFloat(
                      threshold
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : `Your balance is getting close to your minimum threshold of ₱${parseFloat(
                      threshold
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} (within 20%)`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowThresholdAlert(false)}
            className={`${
              balanceData.currentBalance <= parseFloat(threshold)
                ? "text-red-400 hover:text-red-300"
                : "text-orange-400 hover:text-orange-300"
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Negative Balance Alert */}
      {balanceData.currentBalance < 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-red-500/30 bg-red-900/30 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-red-400">
                Negative Balance Warning
              </p>
              <p className="text-sm text-red-300">
                Your current balance is negative. Consider adding funds or
                reducing expenses.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowThresholdAlert(false)}
            className="text-red-400 hover:text-red-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Goal Progress Card */}
      <div className="bg-gray-800 p-3 sm:p-6 rounded-xl border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-gray-400 text-xs sm:text-sm font-medium">
            Savings Goal
          </h3>
          <Link
            to="/goals"
            className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm"
          >
            {primaryGoal ? "Edit" : "Add Goal"} →
          </Link>
        </div>

        {primaryGoal ? (
          <div className="space-y-4">
            {balanceData.currentBalance >= parseFloat(primaryGoal.amount) && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-400 text-sm font-medium">
                  🎉 Congratulations! You've reached your target of ₱
                  {parseFloat(primaryGoal.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-base sm:text-lg font-medium text-white">
                {primaryGoal.description}
              </h4>
              <p className="text-xs sm:text-sm text-gray-400">
                Target: {formatDate(primaryGoal.target_date)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span
                  className={
                    balanceData.currentBalance >= parseFloat(primaryGoal.amount)
                      ? "text-green-400"
                      : "text-white"
                  }
                >
                  {Math.min(
                    Math.round(
                      (balanceData.currentBalance / primaryGoal.amount) * 100
                    ) || 0,
                    100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`${
                    balanceData.currentBalance >= parseFloat(primaryGoal.amount)
                      ? "bg-green-500"
                      : "bg-purple-500"
                  } rounded-full h-2 transition-all duration-500`}
                  style={{
                    width: `${Math.min(
                      (balanceData.currentBalance / primaryGoal.amount) * 100 ||
                        0,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Current</span>
                <span className="text-white">
                  ₱
                  {balanceData.currentBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Target</span>
                <span className="text-white">
                  ₱
                  {parseFloat(primaryGoal.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-2">No active savings goal</p>
            <Link to="/goals" className="text-purple-400 hover:text-purple-300">
              Set a new goal to start tracking your progress
            </Link>
          </div>
        )}
      </div>

      {/* Financial Profile Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 sm:p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Financial Profile
        </h3>

        {financialProfile ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500/10 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-white">
                  {financialProfile.profile.type}
                </h4>
                <p className="text-gray-400">
                  {financialProfile.profile.description}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Savings Rate</span>
                <span className="text-white">
                  {Math.round(financialProfile.savingsRate)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 rounded-full h-2 transition-all duration-500"
                  style={{
                    width: `${Math.min(financialProfile.savingsRate, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-400">
                Recommendations
              </h5>
              <ul className="space-y-2">
                {financialProfile.profile.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-center space-x-2 text-sm text-gray-300"
                  >
                    <span className="text-purple-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="bg-purple-500/10 p-4 rounded-full inline-flex">
              <svg
                className="h-8 w-8 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300">Not Enough Transaction Data</p>
              <p className="text-sm text-gray-400">
                Add at least 5 income and 5 expense transactions to generate
                your financial profile.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Updates Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 mt-6">
        <div className="p-3 sm:p-6 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-medium text-white">
              Recent Updates
            </h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 w-full sm:w-auto"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 w-full sm:w-auto"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-800 z-10">
              <tr className="text-left text-gray-400 text-xs sm:text-sm">
                <th className="p-3 sm:p-4">Type</th>
                <th className="p-3 sm:p-4">Amount</th>
                <th className="hidden sm:table-cell p-4">Description</th>
                <th className="hidden sm:table-cell p-4">Category</th>
                <th className="p-3 sm:p-4">
                  <span className="hidden sm:inline">Date</span>
                  <span className="sm:hidden">Date/Time</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-xs sm:text-sm">
              {getFilteredTransactions()
                .slice(
                  (currentPage - 1) * transactionsPerPage,
                  currentPage * transactionsPerPage
                )
                .map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="text-gray-300 hover:bg-gray-700/50"
                  >
                    <td className="p-3 sm:p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === "income"
                            ? "text-green-500 bg-green-500/10"
                            : "text-red-500 bg-red-500/10"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={
                          transaction.type === "income"
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {transaction.type === "income" ? "+" : "-"}₱
                        {parseFloat(transaction.amount).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell p-4">
                      {transaction.description}
                    </td>
                    <td className="hidden sm:table-cell p-4">
                      {transaction.category_name || "-"}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span>
                          {new Date(transaction.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              timeZone: userTimezone,
                            }
                          )}
                        </span>
                        <span className="text-gray-500 text-xs sm:text-sm sm:ml-2">
                          {new Date(transaction.created_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: userTimezone,
                            }
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        totalItems={getFilteredTransactions().length}
        itemsPerPage={transactionsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};

export default Dashboard;
