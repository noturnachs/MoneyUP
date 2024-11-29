import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("monthly");
  const [summaryData, setSummaryData] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch summary data
      const summaryResponse = await fetch(
        `http://localhost:5000/api/analytics/summary?timeframe=${timeframe}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const summaryData = await summaryResponse.json();

      // Fetch expenses by category
      const categoryResponse = await fetch(
        `http://localhost:5000/api/analytics/expenses-by-category?timeframe=${timeframe}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const categoryData = await categoryResponse.json();

      setSummaryData(summaryData);
      setExpensesByCategory(categoryData.categories);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Timeframe Selection */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Financial Analytics</h1>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Total Income</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summaryData?.totalIncome || 0)}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Total Expenses</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summaryData?.totalExpenses || 0)}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Net Savings</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(
              (summaryData?.totalIncome || 0) -
                (summaryData?.totalExpenses || 0)
            )}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Income vs Expenses
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summaryData?.comparison || []}
                margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                  tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                    padding: "8px",
                  }}
                  formatter={(value) => [
                    `₱${value.toLocaleString()}`,
                    undefined,
                  ]}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) => (
                    <span style={{ color: "#9CA3AF" }}>{value}</span>
                  )}
                />
                <Bar
                  dataKey="income"
                  fill="#10B981"
                  name="Income"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="#EF4444"
                  name="Expenses"
                  radius={[4, 4, 0, 0]}
                />
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    name,
                  }) => {
                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x =
                      cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y =
                      cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return percent > 0.05 ? (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                      >
                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    ) : null;
                  }}
                  outerRadius={100}
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-medium text-white mb-4">
            Income & Expenses Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={summaryData?.comparison || []}
                margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                  tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                    padding: "8px",
                  }}
                  formatter={(value) => [
                    `₱${value.toLocaleString()}`,
                    undefined,
                  ]}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) => (
                    <span style={{ color: "#9CA3AF" }}>{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#3b82f6"
                  name="Income"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#EF4444" // Red color for expenses
                  name="Expenses"
                  strokeWidth={2}
                  dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                  // Invert the Y axis for expenses to show downward trend
                  yAxisId="expenses"
                />
                <YAxis
                  yAxisId="expenses"
                  orientation="right"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                  tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  width={80}
                  // Invert the domain to make expenses go downward
                  domain={["dataMax", "dataMin"]}
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
