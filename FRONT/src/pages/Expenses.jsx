import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionList from "../components/transactions/TransactionList";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (expenseData) => {
    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        setShowTransactionForm(false);
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <button
            onClick={() => setShowTransactionForm(!showTransactionForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Expense
          </button>
        </div>

        {showTransactionForm && (
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <TransactionForm
              onSubmit={handleAddExpense}
              type="expense"
              onCancel={() => setShowTransactionForm(false)}
            />
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <TransactionList expenses={expenses} />
        </div>
      </div>
    </div>
  );
};

export default Expenses;
