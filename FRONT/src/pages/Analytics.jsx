import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("monthly");
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const COLORS = [
    "#8b5cf6", // purple-500
    "#6366f1", // indigo-500
    "#3b82f6", // blue-500
    "#0ea5e9", // sky-500
    "#06b6d4", // cyan-500
    "#14b8a6", // teal-500
    "#10b981", // emerald-500
    "#22c55e", // green-500
  ];

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch summary data
      const summaryResponse = await fetch(
        `http://localhost:5000/api/income/total`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const incomeData = await summaryResponse.json();

      const expenseResponse = await fetch(
        `http://localhost:5000/api/expenses/total`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const expenseData = await expenseResponse.json();

      // Calculate summary data
      const totalIncome = parseFloat(incomeData.total || 0);
      const totalExpenses = parseFloat(expenseData.total || 0);
      const netSavings = totalIncome - totalExpenses;
      const savingsRate =
        totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

      setSummaryData({
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
      });

      // Fetch expenses by category
      const categoryResponse = await fetch(
        `http://localhost:5000/api/expenses/by-category`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const categoryData = await categoryResponse.json();
      setExpensesByCategory(categoryData.categories || []);

      // Fetch income vs expenses data
      const trendResponse = await fetch(
        `http://localhost:5000/api/analytics/income-vs-expenses?timeframe=${timeframe}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const trendData = await trendResponse.json();
      setIncomeVsExpenses(trendData.data || []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsVisible(true), 100);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 border border-gray-700 rounded-lg">
          <p className="text-gray-300">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ease-in-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Header and Timeframe Selection */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Financial Analytics</h1>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Total Income</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summaryData.totalIncome)}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Total Expenses</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summaryData.totalExpenses)}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Net Savings</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summaryData.netSavings)}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Savings Rate</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {summaryData.savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Income vs Expenses
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="period"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                  tickFormatter={(value) => `₱${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10B981" />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Expenses by Category
          </h3>
          <div className="h-80">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={90}
                    label={({ name, percent }) => {
                      if (percent < 0.03) return null; // Hide very small segments
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    labelLine={{
                      strokeWidth: 1,
                      stroke: "#6B7280",
                      length: 10,
                      angle: 45,
                    }}
                    labelStyle={{
                      fill: "#9CA3AF", // text color
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        strokeWidth={1}
                        stroke="#1F2937" // dark border for contrast
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                      padding: "8px 12px",
                      color: "#E5E7EB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 text-lg">No expenses found</p>
              </div>
            )}
          </div>
        </div>

        {/* Income & Expenses Trend Line Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-medium text-white mb-4">
            Income & Expenses Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="period"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                  tickFormatter={(value) => `₱${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981" }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: "#EF4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
