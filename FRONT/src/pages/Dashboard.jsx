import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionList from "../components/transactions/TransactionList";
import ExpenseChart from "../components/charts/ExpenseChart";
import IncomeVsExpense from "../components/charts/IncomeVsExpense";

const Dashboard = () => {
  const { user } = useAuth();
  const [hasData, setHasData] = useState(false);
  const [step, setStep] = useState(1);
  const [initialBalance, setInitialBalance] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [balanceData, setBalanceData] = useState({
    totalBalance: 0,
    currentBalance: 0,
    monthlyExpenses: 0,
    expenseChange: 0,
  });
  const [newIncome, setNewIncome] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [balanceChanges, setBalanceChanges] = useState({
    totalChange: 0,
    currentChange: 0,
    lastChangeDate: null,
    balanceAfter: 0,
    balanceBefore: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Check if user has any transactions
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

  // Move fetchBalanceData outside useEffect
  const fetchBalanceData = async () => {
    try {
      // First, get total income
      const incomeResponse = await fetch(
        "http://localhost:5000/api/income/total",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const incomeData = await incomeResponse.json();

      // Then get total expenses
      const expenseResponse = await fetch(
        "http://localhost:5000/api/expenses/total",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const expenseData = await expenseResponse.json();

      // Calculate balances
      const totalIncome = parseFloat(incomeData.total || 0);
      const totalExpenses = parseFloat(expenseData.total || 0);
      const currentBalance = totalIncome - totalExpenses;

      setBalanceData({
        totalBalance: totalIncome,
        currentBalance: currentBalance,
        monthlyExpenses: totalExpenses,
        expenseChange: 0, // You can calculate this separately if needed
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Add function to fetch income history
  const fetchIncomeHistory = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/income", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setIncomeHistory(data.incomes || []);
      }
    } catch (error) {
      console.error("Error fetching income history:", error);
    }
  };

  // Update the fetchLastTransaction function
  const fetchLastTransaction = async () => {
    try {
      // Fetch both income and expenses
      const [incomeResponse, expenseResponse] = await Promise.all([
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

      const incomeData = await incomeResponse.json();
      const expenseData = await expenseResponse.json();

      // Get the most recent transaction from both types
      const allTransactions = [
        ...(incomeData.incomes || []).map((income) => ({
          ...income,
          type: "income",
          change: parseFloat(income.amount),
        })),
        ...(expenseData.expenses || []).map((expense) => ({
          ...expense,
          type: "expense",
          change: -parseFloat(expense.amount),
        })),
      ];

      // Sort by date and get the most recent
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastTransaction = allTransactions[0];

      if (lastTransaction) {
        setBalanceChanges({
          totalChange:
            lastTransaction.type === "income"
              ? parseFloat(lastTransaction.amount)
              : 0,
          currentChange: lastTransaction.change,
          lastChangeDate: lastTransaction.date,
          balanceAfter: lastTransaction.balance_after || 0,
          balanceBefore: lastTransaction.balance_before || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching last transaction:", error);
    }
  };

  // Update the fetchRecentTransactions function
  const fetchRecentTransactions = async () => {
    try {
      // Fetch both income and expenses
      const [incomeResponse, expenseResponse] = await Promise.all([
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

      const incomeData = await incomeResponse.json();
      const expenseData = await expenseResponse.json();

      // Combine and format transactions
      const allTransactions = [
        ...(incomeData.incomes || []).map((income) => ({
          ...income,
          type: "income",
        })),
        ...(expenseData.expenses || []).map((expense) => ({
          ...expense,
          type: "expense",
        })),
      ];

      // Sort by date, most recent first
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      setRecentTransactions(allTransactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
    }
  };

  // Add this new function to fetch categories
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
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Add a separate useEffect for fetching categories
  useEffect(() => {
    fetchCategories();
  }, []); // This will run when component mounts

  // Update useEffect to fetch both balance and income history
  useEffect(() => {
    if (hasData) {
      fetchBalanceData();
      fetchIncomeHistory();
      fetchLastTransaction();
      fetchRecentTransactions();
    }
  }, [hasData]);

  const handleInitialSetup = async (e) => {
    e.preventDefault();

    if (!initialBalance || !selectedCategory) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/income", {
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

      if (response.ok) {
        setStep(3);
        setTimeout(() => {
          setHasData(true);
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Error setting initial balance:", error);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();

    if (!newIncome || !incomeDescription || !selectedCategory) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: parseFloat(newIncome),
          description: incomeDescription,
          category_id: selectedCategory,
          date: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchBalanceData();
        await fetchIncomeHistory();
        setBalanceChanges({
          totalChange: parseFloat(newIncome),
          currentChange: parseFloat(newIncome),
          lastChangeDate: new Date().toISOString(),
        });

        // Clear form including category
        setNewIncome("");
        setIncomeDescription("");
        setSelectedCategory("");
      } else {
        console.error("Failed to add income:", data.message);
        alert("Failed to add income. Please try again.");
      }
    } catch (error) {
      console.error("Error adding income:", error);
      alert("An error occurred. Please try again.");
    }
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
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Net Balance</h3>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-bold text-white">
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
            <p className="text-2xl font-bold text-white">
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
            <p className="text-2xl font-bold text-white">
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
              {recentTransactions.map((transaction) => (
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
                      {parseFloat(transaction.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    {transaction.description}
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    {transaction.category_name || "-"}
                  </td>
                  <td className="p-4">
                    {new Date(transaction.date).toLocaleDateString()}
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(transaction.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
      </div>
    </div>
  );
};

export default Dashboard;
