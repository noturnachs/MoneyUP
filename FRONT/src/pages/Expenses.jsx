import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ring } from "ldrs";

// Initialize the loader
ring.register();

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        fetchCurrentBalance(),
      ]);
      setTimeout(() => setIsVisible(true), 100);
    };
    fetchData();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/categories/type/expense`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentBalance = async () => {
    try {
      const [incomeResponse, expenseResponse] = await Promise.all([
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
      ]);

      const incomeData = await incomeResponse.json();
      const expenseData = await expenseResponse.json();

      const totalIncome = parseFloat(incomeData.total) || 0;
      const totalExpenses = parseFloat(expenseData.total) || 0;
      setCurrentBalance(totalIncome - totalExpenses);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!newExpense || !expenseDescription || !selectedCategory) {
      alert("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    const expenseAmount = parseFloat(newExpense);
    if (expenseAmount > currentBalance) {
      setPendingExpense({
        amount: expenseAmount,
        description: expenseDescription,
        category_id: selectedCategory,
        date: new Date().toISOString(),
      });
      setShowWarningModal(true);
      setIsSubmitting(false);
      return;
    }

    await submitExpense({
      amount: expenseAmount,
      description: expenseDescription,
      category_id: selectedCategory,
      date: new Date().toISOString(),
    });
  };

  const submitExpense = async (expenseData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(expenseData),
        }
      );

      if (response.ok) {
        await Promise.all([fetchExpenses(), fetchCurrentBalance()]);
        setNewExpense("");
        setExpenseDescription("");
        setSelectedCategory("");
        setShowExpenseForm(false);
        setShowWarningModal(false);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        <span className="mt-4 text-gray-400">Loading expenses...</span>
      </div>
    );
  }

  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ease-in-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Expense
          </button>
        </div>

        {showExpenseForm && (
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Amount
                </label>
                <input
                  type="number"
                  value={newExpense}
                  onChange={(e) => setNewExpense(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
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

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <l-ring
                        size="15"
                        stroke="2"
                        bg-opacity="0"
                        speed="2"
                        color="white"
                      />
                      <span>Adding...</span>
                    </>
                  ) : (
                    "Add Expense"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          {expenses.length > 0 ? (
            <div className="overflow-x-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-xs sm:text-sm">
                    <th className="p-3 sm:p-4 whitespace-nowrap w-1/3 sm:w-auto">
                      Amount
                    </th>
                    <th className="p-3 sm:p-4 w-2/3 sm:w-auto">Description</th>
                    <th className="hidden sm:table-cell p-4">Category</th>
                    <th className="hidden sm:table-cell p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {expenses.map((expense) => (
                    <tr
                      key={expense.expense_id || expense.id}
                      className="text-gray-300 hover:bg-gray-700/50 text-xs sm:text-sm"
                    >
                      <td className="p-3 sm:p-4 whitespace-nowrap w-1/3 sm:w-auto">
                        <span className="text-red-500">
                          -₱
                          {parseFloat(expense.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 w-2/3 sm:w-auto">
                        <div className="flex flex-col">
                          <span className="text-gray-300">
                            {expense.description}
                          </span>
                          <span className="text-gray-500 text-xs mt-1 sm:hidden">
                            {expense.category_name || "-"}
                          </span>
                          <span className="text-gray-500 text-xs mt-1 sm:hidden">
                            {new Date(
                              expense.created_at || expense.date
                            ).toLocaleDateString()}{" "}
                            {new Date(
                              expense.created_at || expense.date
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-4">
                        {expense.category_name || "-"}
                      </td>
                      <td className="hidden sm:table-cell p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span>
                            {new Date(
                              expense.created_at || expense.date
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-gray-500 text-xs sm:ml-2">
                            {new Date(
                              expense.created_at || expense.date
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-400 text-sm sm:text-base">
                No expenses found
              </p>
            </div>
          )}
        </div>

        {showWarningModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-white mb-4">Warning</h3>
              <p className="text-gray-300 mb-6">
                Insufficient balance for this expense.
                <br />
                <br />
                Current Balance: ₱
                {currentBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <br />
                Expense Amount: ₱
                {parseFloat(pendingExpense?.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowWarningModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitExpense(pendingExpense)}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <l-ring
                        size="15"
                        stroke="2"
                        bg-opacity="0"
                        speed="2"
                        color="white"
                      />
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Proceed Anyway"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
