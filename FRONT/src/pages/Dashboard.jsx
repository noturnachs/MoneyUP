import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { CheckCircleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Dashboard = () => {
  const { user } = useAuth();
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

  const fetchThreshold = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/threshold", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setThreshold(data.threshold || "");
      }
    } catch (error) {
      console.error("Error fetching threshold:", error);
    }
  }, []);

  const handleThresholdSubmit = async (thresholdValue) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/threshold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ threshold: thresholdValue || null }),
      });

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
      const incomeResponse = await fetch("http://localhost:5000/api/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: initialBalance,
          description: "Initial Balance",
          category_id: selectedCategory,
          date: new Date().toISOString(),
        }),
      });

      if (!incomeResponse.ok) {
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
      const response = await fetch("http://localhost:5000/api/goals/primary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
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
    if (hasData) {
      fetchThreshold();
      fetchPrimaryGoal();
    }
  }, [hasData, fetchThreshold, fetchPrimaryGoal]);

  useEffect(() => {
    if (threshold && balanceData.currentBalance) {
      const thresholdValue = parseFloat(threshold);
      const currentBalance = parseFloat(balanceData.currentBalance);
      const warningThreshold = thresholdValue * 1.1; // Alert when within 10% of threshold

      if (currentBalance <= warningThreshold) {
        setShowThresholdAlert(true);
      } else {
        setShowThresholdAlert(false);
      }
    }
  }, [threshold, balanceData.currentBalance]);

  // Initial data check
  useEffect(() => {
    const checkUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/income", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setHasData(data.incomes && data.incomes.length > 0);
      } catch (error) {
        console.error("Error checking user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserData();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (hasData) {
      const fetchDashboardData = async () => {
        try {
          // Fetch balance data and recent transactions in parallel
          const [incomeResponse, expenseResponse] = await Promise.all([
            fetch("http://localhost:5000/api/income/total", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
            fetch("http://localhost:5000/api/expenses/total", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
          ]);

          const [incomeData, expenseData] = await Promise.all([
            incomeResponse.json(),
            expenseResponse.json(),
          ]);

          // Calculate total income and expenses
          const totalIncome = parseFloat(incomeData.total || 0);
          const totalExpenses = parseFloat(expenseData.total || 0);

          // Set balance data with correct calculations
          setBalanceData({
            totalBalance: totalIncome, // Net total of all income
            currentBalance: totalIncome - totalExpenses, // Income minus expenses
            monthlyExpenses: totalExpenses,
            expenseChange: 0, // Calculate if needed
          });

          // Fetch recent transactions
          const [recentIncomeRes, recentExpenseRes] = await Promise.all([
            fetch("http://localhost:5000/api/income/recent", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
            fetch("http://localhost:5000/api/expenses/recent", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
          ]);

          const [recentIncome, recentExpense] = await Promise.all([
            recentIncomeRes.json(),
            recentExpenseRes.json(),
          ]);

          // Combine and sort transactions
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

          // Update balance changes based on most recent transaction
          if (allTransactions.length > 0) {
            const latest = allTransactions[0];
            setBalanceChanges({
              totalChange: latest.type === "income" ? latest.amount : 0,
              currentChange:
                latest.type === "income" ? latest.amount : -latest.amount,
              lastChangeDate: latest.created_at,
            });
          }

          // After all data is loaded, set visibility to true
          setIsLoading(false);
          // Small delay to ensure smooth transition
          setTimeout(() => setIsVisible(true), 200);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setIsLoading(false);
          setIsVisible(true);
        }
      };

      fetchDashboardData();
    }
  }, [hasData]);

  // Only fetch categories if needed for initial setup
  useEffect(() => {
    if (!hasData) {
      const fetchCategories = async () => {
        try {
          const response = await fetch(
            "http://localhost:5000/api/categories/type/income",
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const data = await response.json();
          setCategories(data.categories || []);
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      };

      fetchCategories();
    }
  }, [hasData]);

  const Pagination = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
          to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          entries
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => onPageChange(index + 1)}
              className={`px-3 py-1 rounded-md ${
                currentPage === index + 1
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
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
      {/* Overview Cards */}
      {/* Threshold Alert */}
      {showThresholdAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            balanceData.currentBalance < threshold
              ? "bg-red-900/50 border-red-500/50"
              : "bg-yellow-900/50 border-yellow-500/50"
          } border rounded-lg p-4 flex items-center justify-between`}
        >
          <div className="flex items-center space-x-3">
            <svg
              className={`h-5 w-5 ${
                balanceData.currentBalance < threshold
                  ? "text-red-500"
                  : "text-yellow-500"
              } animate-pulse`}
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
                className={`${
                  balanceData.currentBalance < threshold
                    ? "text-red-500"
                    : "text-yellow-500"
                } font-medium`}
              >
                {balanceData.currentBalance < threshold
                  ? "Low Balance Warning"
                  : "Low Balance Alert"}
              </p>
              <p
                className={`${
                  balanceData.currentBalance < threshold
                    ? "text-red-500/80"
                    : "text-yellow-500/80"
                } text-sm`}
              >
                {balanceData.currentBalance < threshold
                  ? `Your balance is below your minimum threshold of ₱${parseFloat(
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
                    })}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowThresholdAlert(false)}
            className={`${
              balanceData.currentBalance < threshold
                ? "text-red-500/80 hover:text-red-500"
                : "text-yellow-500/80 hover:text-yellow-500"
            } transition-colors`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </motion.div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Net Savings</h3>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-bold text-green-500">
              ₱
              {(balanceData?.totalBalance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {balanceChanges?.totalChange !== 0 && (
              <div className="flex items-center text-sm text-green-500">
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

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Current Balance</h3>
          <div className="mt-2 space-y-1">
            <p
              className={`text-2xl font-bold ${
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
                className={`flex items-center text-sm ${
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
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Expenses</h3>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-bold text-red-500">
              ₱
              {(balanceData?.monthlyExpenses || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {balanceData?.expenseChange !== 0 && (
              <div
                className={`flex items-center text-sm ${
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

      {/* Goal Progress Card */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Savings Goal</h3>
          <Link
            to="/goals"
            className="text-purple-400 hover:text-purple-300 text-sm"
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
              <h4 className="text-lg font-medium text-white">
                {primaryGoal.description}
              </h4>
              <p className="text-sm text-gray-400">
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

      {/* Recent Updates Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 mt-6">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Recent Updates</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-800 z-10">
              <tr className="text-left text-gray-400 text-sm">
                <th className="p-4">Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4 hidden md:table-cell">Description</th>
                <th className="p-4 hidden md:table-cell">Category</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentTransactions
                .slice(
                  (currentPage - 1) * transactionsPerPage,
                  currentPage * transactionsPerPage
                )
                .map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="text-gray-300 hover:bg-gray-700/50"
                  >
                    <td className="p-4">
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
                    <td className="p-4">
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
                    <td className="p-4 hidden md:table-cell">
                      {transaction.description}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {transaction.category_name || "-"}
                    </td>
                    <td className="p-4">
                      {new Date(transaction.created_at).toLocaleDateString()}
                      <span className="text-gray-500 text-sm ml-2">
                        {new Date(transaction.created_at).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentTransactions.length > 0 && (
          <Pagination
            totalItems={recentTransactions.length}
            itemsPerPage={transactionsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
