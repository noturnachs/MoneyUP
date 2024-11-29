const TransactionList = ({ expenses }) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">No expenses found</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr className="text-left text-gray-400 text-sm">
            <th className="p-4">Description</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Category</th>
            <th className="p-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {expense.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ₱{expense.amount.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {expense.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {new Date(expense.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;
