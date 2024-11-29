import { useState, useEffect } from "react";

const TransactionForm = ({
  onSubmit,
  type = "expense",
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    amount: initialData?.amount?.toString() || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount?.toString() || "",
        description: initialData.description || "",
        category: initialData.category || "",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ amount: "", description: "", category: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400">
          Amount
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
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
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
        >
          <option value="">Select a category</option>
          <option value="Food">Food</option>
          <option value="Transportation">Transportation</option>
          <option value="Utilities">Utilities</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
