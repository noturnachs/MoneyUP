import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { ring } from "ldrs";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Initialize the loader
ring.register();

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
  const [spendingInsights, setSpendingInsights] = useState({
    monthlyComparison: [],
    categoryInsights: [],
    unusualSpending: [],
  });

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

  // Combine all data fetching into a single useEffect
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [
          summaryResponse,
          expenseResponse,
          categoryResponse,
          trendResponse,
          insightsResponse,
        ] = await Promise.all([
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
          fetch(`${process.env.REACT_APP_API_URL}/expenses/by-category`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch(
            `${process.env.REACT_APP_API_URL}/analytics/income-vs-expenses?timeframe=${timeframe}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          ),
          fetch(`${process.env.REACT_APP_API_URL}/analytics/insights`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

        const [incomeData, expenseData, categoryData, trendData, insightsData] =
          await Promise.all([
            summaryResponse.json(),
            expenseResponse.json(),
            categoryResponse.json(),
            trendResponse.json(),
            insightsResponse.json(),
          ]);

        // Calculate and update summary data
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

        // Update other state
        if (categoryData.success) {
          setExpensesByCategory(categoryData.categories || []);
        }

        setIncomeVsExpenses(trendData.data || []);

        // Update insights state
        if (insightsData.success) {
          setSpendingInsights(insightsData.insights);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    fetchAnalyticsData();
  }, [timeframe]); // Only re-fetch when timeframe changes

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
        <span className="mt-4 text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  // Add chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#9CA3AF",
        },
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#E5E7EB",
        bodyColor: "#E5E7EB",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: "#9CA3AF",
          callback: (value) => formatCurrency(value),
        },
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
      },
      x: {
        ticks: {
          color: "#9CA3AF",
        },
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
      },
    },
  };

  // Transform data for Chart.js
  const barChartData = {
    labels: incomeVsExpenses.map((item) => item.period),
    datasets: [
      {
        label: "Income",
        data: incomeVsExpenses.map((item) => item.income),
        backgroundColor: "#10B981",
        borderColor: "#10B981",
        borderWidth: 1,
      },
      {
        label: "Expenses",
        data: incomeVsExpenses.map((item) => item.expenses),
        backgroundColor: "#EF4444",
        borderColor: "#EF4444",
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: expensesByCategory?.map((cat) => cat.category) || [],
    datasets: [
      {
        label: "Expenses",
        data: expensesByCategory?.map((cat) => cat.amount) || [],
        backgroundColor: COLORS,
        borderColor: COLORS.map((color) => color + "88"), // Add some transparency
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: "right",
      },
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const value = context.raw;
            return `${context.label}: ${new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
            }).format(value)}`;
          },
        },
      },
    },
  };

  const lineChartData = {
    labels: incomeVsExpenses.map((item) => item.period),
    datasets: [
      {
        label: "Income",
        data: incomeVsExpenses.map((item) => item.income),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Expenses",
        data: incomeVsExpenses.map((item) => item.expenses),
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Update the insights rendering section
  const renderInsightIcon = (type) => {
    if (type === "increase") {
      return (
        <svg
          className="h-5 w-5 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-5 w-5 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      </svg>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "high":
        return "bg-red-400";
      case "normal":
        return "bg-green-400";
      case "low":
        return "bg-blue-400";
      default:
        return "bg-yellow-400";
    }
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

      {/* Spending Insights */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-purple-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Spending Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Monthly Comparison */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-gray-400 text-sm font-medium mb-3">
              Monthly Comparison
            </h4>
            <div className="space-y-2">
              {spendingInsights.monthlyComparison?.length > 0 ? (
                spendingInsights.monthlyComparison.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${
                      insight.type === "increase"
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {renderInsightIcon(insight.type)}
                    <span className="text-sm">{insight.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">
                  Monthly comparison unavailable
                </div>
              )}
            </div>
          </div>

          {/* Category Insights */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-gray-400 text-sm font-medium mb-3">
              Category Analysis
            </h4>
            <div className="space-y-2">
              {spendingInsights.categoryInsights?.length > 0 ? (
                spendingInsights.categoryInsights.map((insight, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          insight.status
                        )}`}
                      ></span>
                      {insight.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">
                  Category analysis unavailable
                </div>
              )}
            </div>
          </div>

          {/* Unusual Spending */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-gray-400 text-sm font-medium mb-3">
              Unusual Spending
            </h4>
            <div className="space-y-2">
              {spendingInsights.unusualSpending?.length > 0 ? (
                spendingInsights.unusualSpending.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${
                      insight.type === "increase"
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {renderInsightIcon(insight.type)}
                    <span className="text-sm">
                      {insight.message}
                      {insight.amount && (
                        <span className="block text-xs text-gray-400 mt-1">
                          Amount: {formatCurrency(insight.amount)}
                        </span>
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">
                  No unusual spending detected
                </div>
              )}
            </div>
          </div>
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
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Expenses by Category
          </h3>
          <div className="h-80">
            {expensesByCategory.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
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
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
