import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Income = () => {
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [newIncome, setNewIncome] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchIncomeHistory();
    fetchCategories();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Income History */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="p-4">Amount</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {incomeHistory.map((income) => (
                  <tr
                    key={income.id}
                    className="text-gray-300 hover:bg-gray-700/50"
                  >
                    <td className="p-4">
                      <span className="text-green-500">
                        +₱
                        {parseFloat(income.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-4">{income.description}</td>
                    <td className="p-4">{income.category_name || "-"}</td>
                    <td className="p-4">
                      {new Date(income.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Income;
