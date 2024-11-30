import { useState, useEffect } from "react";
import { ring } from "ldrs";
import { useAuth } from "../context/AuthContext";

// Initialize the loader
ring.register();

const Income = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [newIncome, setNewIncome] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchIncomeHistory(), fetchCategories()]);
        setTimeout(() => setIsVisible(true), 100);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchIncomeHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/income`, {
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

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/categories/type/income`,
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

  const handleAddIncome = async (e) => {
    e.preventDefault();

    if (!newIncome || !incomeDescription || !selectedCategory) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/income`, {
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

      if (response.ok) {
        await fetchIncomeHistory();
        setNewIncome("");
        setIncomeDescription("");
        setSelectedCategory("");
        setShowIncomeForm(false);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to add income");
      }
    } catch (error) {
      console.error("Error adding income:", error);
      alert("An error occurred. Please try again.");
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
        <span className="mt-4 text-gray-400">Loading income records...</span>
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Income</h1>
          <button
            onClick={() => setShowIncomeForm(!showIncomeForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Income
          </button>
        </div>

        {/* Add Income Form */}
        {showIncomeForm && (
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Amount
                </label>
                <input
                  type="number"
                  value={newIncome}
                  onChange={(e) => setNewIncome(e.target.value)}
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
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
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
                  onClick={() => setShowIncomeForm(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Add Income
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Income Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          {incomeHistory.length > 0 ? (
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
                  {incomeHistory.map((income) => (
                    <tr
                      key={income.income_id || income.id}
                      className="text-gray-300 hover:bg-gray-700/50 text-xs sm:text-sm"
                    >
                      <td className="p-3 sm:p-4 whitespace-nowrap w-1/3 sm:w-auto">
                        <span className="text-green-500">
                          +₱
                          {parseFloat(income.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 w-2/3 sm:w-auto">
                        <div className="flex flex-col">
                          <span className="text-gray-300">
                            {income.description}
                          </span>
                          <span className="text-gray-500 text-xs mt-1 sm:hidden">
                            {income.category_name || "-"}
                          </span>
                          <span className="text-gray-500 text-xs mt-1 sm:hidden">
                            {new Date(
                              income.created_at || income.date
                            ).toLocaleDateString()}{" "}
                            {new Date(
                              income.created_at || income.date
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-4">
                        {income.category_name || "-"}
                      </td>
                      <td className="hidden sm:table-cell p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span>
                            {new Date(
                              income.created_at || income.date
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-gray-500 text-xs sm:ml-2">
                            {new Date(
                              income.created_at || income.date
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
                No income records found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Income;
