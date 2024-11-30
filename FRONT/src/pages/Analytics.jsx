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
    labels: expensesByCategory.map((item) => item.category),
    datasets: [
      {
        data: expensesByCategory.map((item) => item.amount),
        backgroundColor: COLORS,
        borderColor: "#1F2937",
        borderWidth: 1,
      },
    ],
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
              <Doughnut
                data={doughnutData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: "right",
                    },
                  },
                }}
              />
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
