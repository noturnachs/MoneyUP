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
  const [balanceData, setBalanceData] = useState({ currentBalance: null });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/goals`, {
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

      if (incomeData.success && expenseData.success) {
        const totalIncome = parseFloat(incomeData.total) || 0;
        const totalExpenses = parseFloat(expenseData.total) || 0;
        const currentBalance = totalIncome - totalExpenses;

        if (!isNaN(currentBalance)) {
          setBalanceData({ currentBalance });
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `${process.env.REACT_APP_API_URL}/goals/${currentGoal.id}`
        : `${process.env.REACT_APP_API_URL}/goals`;

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

  const handleDelete = (goal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/goals/${goalToDelete.goal_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        fetchGoals();
        setShowDeleteModal(false);
        setGoalToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
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

  const handleMarkAccomplished = async (
    goalId,
    goalAmount,
    goalDescription
  ) => {
    try {
      // First mark the goal as accomplished
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/goals/${goalId}/accomplish`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            amount: goalAmount,
          }),
        }
      );

      if (response.ok) {
        // Create an expense for the accomplished goal amount
        const expenseResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/expenses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              amount: goalAmount,
              description: `Goal Accomplished: ${goalDescription}`,
              category_id: 1, // Make sure to use appropriate category_id for goals
              date: new Date().toISOString(),
            }),
          }
        );

        if (expenseResponse.ok) {
          // Dispatch event to update balances across the app
          window.dispatchEvent(new Event("expenseAdded"));

          // Refresh goals and balance
          await Promise.all([fetchGoals(), fetchBalance()]);
        } else {
          alert("Failed to update balance");
        }
      } else {
        const data = await response.json();
        alert(data.message || "Failed to mark goal as accomplished");
      }
    } catch (error) {
      console.error("Error marking goal as accomplished:", error);
      alert("Failed to mark goal as accomplished");
    }
  };

  if (isLoading || balanceData.currentBalance === null) {
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
            const progress = goal.is_completed
              ? 100
              : Math.min(
                  Math.round(
                    (balanceData.currentBalance / parseFloat(goal.amount)) * 100
                  ),
                  100
                );

            const isAchievable =
              balanceData.currentBalance >= parseFloat(goal.amount);

            return (
              <motion.div
                key={goal.goal_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4 relative"
              >
                {goal.is_completed ? (
                  // Accomplished banner for completed goals
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 mb-4">
                    <p className="text-green-400 text-sm font-medium flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
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
                      Goal Accomplished!
                    </p>
                  </div>
                ) : isAchievable && !goal.is_completed ? (
                  // Mark as accomplished button for achievable but not completed goals
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm font-medium flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
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
                      Goal Reached! Click here to mark as accomplished
                    </p>
                    <button
                      onClick={() =>
                        handleMarkAccomplished(
                          goal.goal_id,
                          goal.amount,
                          goal.description
                        )
                      }
                      className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Accomplished
                    </button>
                  </div>
                ) : null}

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
                    {!goal.is_completed && (
                      <button
                        onClick={() => handleEdit(goal)}
                        className="text-gray-400 hover:text-purple-400"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(goal)}
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
                        goal.is_completed ? "text-green-400" : "text-white"
                      }
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${
                        goal.is_completed ? "bg-green-500" : "bg-purple-500"
                      } rounded-full h-2 transition-all duration-500`}
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Balance</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-gray-800 border border-gray-700 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setGoalToDelete(null);
                }}
                className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-white">
                  Delete Goal
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">
                    Are you sure you want to delete this goal? This action
                    cannot be undone.
                  </p>
                  <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <p className="text-sm font-medium text-white">
                      {goalToDelete?.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Target Amount: ₱
                      {parseFloat(goalToDelete?.amount || 0).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex w-full justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
              >
                Delete Goal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setGoalToDelete(null);
                }}
                className="mt-3 inline-flex w-full justify-center rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
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
