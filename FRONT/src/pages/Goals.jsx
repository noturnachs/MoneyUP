import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const datePickerStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.8);
    opacity: 0.6;
    cursor: pointer;
  }

  input[type="date"]::-webkit-calendar-picker-indicator:hover {
    opacity: 0.9;
  }

  .date-picker-container:focus-within {
    ring: 2px;
    ring-purple-500;
  }
`;

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGoal, setCurrentGoal] = useState({
    amount: "",
    description: "",
    targetDate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [balanceData, setBalanceData] = useState({ currentBalance: 0 });

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/goals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setGoals(data.goals);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
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

      const incomeData = await incomeResponse.json();
      const expenseData = await expenseResponse.json();

      if (incomeData.success && expenseData.success) {
        const totalIncome = parseFloat(incomeData.total) || 0;
        const totalExpenses = parseFloat(expenseData.total) || 0;
        const currentBalance = totalIncome - totalExpenses;

        setBalanceData({ currentBalance });
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    const handleTransactionUpdate = () => {
      fetchBalance();
    };

    window.addEventListener("incomeAdded", handleTransactionUpdate);
    window.addEventListener("expenseAdded", handleTransactionUpdate);
    window.addEventListener("transactionDeleted", handleTransactionUpdate);

    fetchBalance();

    return () => {
      window.removeEventListener("incomeAdded", handleTransactionUpdate);
      window.removeEventListener("expenseAdded", handleTransactionUpdate);
      window.removeEventListener("transactionDeleted", handleTransactionUpdate);
    };
  }, [fetchBalance]);

  useEffect(() => {
    console.log("Balance Data:", balanceData);
  }, [balanceData]);

  useEffect(() => {
    console.log("Goals:", goals);
  }, [goals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `http://localhost:5000/api/goals/${currentGoal.id}`
        : "http://localhost:5000/api/goals";

      const formattedGoal = {
        amount: parseFloat(currentGoal.amount),
        description: currentGoal.description,
        targetDate: currentGoal.targetDate,
      };

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formattedGoal),
      });

      if (response.ok) {
        await fetchGoals();
        setShowModal(false);
        setCurrentGoal({ amount: "", description: "", targetDate: "" });
        setIsEditing(false);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to save goal");
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("Failed to save goal");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (goalId) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/goals/${goalId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          fetchGoals();
        }
      } catch (error) {
        console.error("Error deleting goal:", error);
      }
    }
  };

  const handleEdit = (goal) => {
    const formattedDate = goal.target_date
      ? new Date(goal.target_date).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10);

    setCurrentGoal({
      id: goal.goal_id,
      amount: goal.amount.toString(),
      description: goal.description,
      targetDate: formattedDate,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Savings Goals</h2>
        <button
          onClick={() => {
            setCurrentGoal({ amount: "", description: "", targetDate: "" });
            setIsEditing(false);
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="bg-gray-700/50 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <PlusIcon className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white">No Goals Yet</h3>
            <p className="text-gray-400">
              Set a goal to start tracking your progress
            </p>
            <button
              onClick={() => {
                setCurrentGoal({ amount: "", description: "", targetDate: "" });
                setIsEditing(false);
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = Math.min(
              Math.round(
                (balanceData.currentBalance / parseFloat(goal.amount)) * 100
              ) || 0,
              100
            );
            const isGoalReached =
              balanceData.currentBalance >= parseFloat(goal.amount);

            return (
              <motion.div
                key={goal.goal_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
              >
                {isGoalReached && (
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 mb-4">
                    <p className="text-green-400 text-sm font-medium">
                      🎉 Congratulations! You've reached your target of ₱
                      {parseFloat(goal.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {goal.description}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Target: {formatDate(goal.target_date)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="text-gray-400 hover:text-purple-400"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.goal_id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span
                      className={
                        isGoalReached ? "text-green-400" : "text-white"
                      }
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${
                        isGoalReached ? "bg-green-500" : "bg-purple-500"
                      } rounded-full h-2 transition-all duration-500`}
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Balance</span>
                    <span className="text-white">
                      ₱
                      {(balanceData.currentBalance || 0).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Target</span>
                    <span className="text-white">
                      ₱
                      {parseFloat(goal.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              {isEditing ? "Edit Goal" : "New Savings Goal"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Target Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">₱</span>
                  </div>
                  <input
                    type="number"
                    required
                    value={currentGoal.amount}
                    onChange={(e) =>
                      setCurrentGoal({ ...currentGoal, amount: e.target.value })
                    }
                    className="pl-8 block w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={currentGoal.description}
                  onChange={(e) =>
                    setCurrentGoal({
                      ...currentGoal,
                      description: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., New Car, Emergency Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Target Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <DatePicker
                    selected={
                      currentGoal.targetDate
                        ? new Date(currentGoal.targetDate)
                        : null
                    }
                    onChange={(date) =>
                      setCurrentGoal({
                        ...currentGoal,
                        targetDate: date.toISOString().split("T")[0],
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    className="pl-10 block w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    wrapperClassName="w-full"
                    calendarClassName="bg-gray-800 border border-gray-700 text-white rounded-lg shadow-lg"
                    customInput={
                      <input className="pl-10 block w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    }
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {isEditing ? "Update" : "Create"} Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{datePickerStyles}</style>
      <style>{`
        .react-datepicker {
          font-family: inherit;
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }

        .react-datepicker__header {
          background-color: #111827 !important;
          border-bottom-color: #374151 !important;
        }

        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker__day {
          color: #fff !important;
        }

        .react-datepicker__day:hover {
          background-color: #4c1d95 !important;
        }

        .react-datepicker__day--selected {
          background-color: #7c3aed !important;
        }

        .react-datepicker__day--disabled {
          color: #6b7280 !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #fff !important;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: #7c3aed !important;
        }
      `}</style>
    </div>
  );
};

export default Goals;
