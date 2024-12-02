import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import ExportAnalytics from "../components/exports/ExportAnalytics";

const CHART_COLORS = [
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#F59E0B", // Yellow
  "#10B981", // Green
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#A855F7", // Violet
];

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [basicData, setBasicData] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasPro =
    user?.subscription?.tier === "pro" ||
    user?.subscription?.tier === "enterprise";

  useEffect(() => {
    console.log("Current user subscription:", user?.subscription);
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const basicResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/analytics/basic`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const basicResult = await basicResponse.json();
      setBasicData(basicResult.data);

      if (hasPro) {
        const advancedResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/analytics/advanced`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (advancedResponse.ok) {
          const advancedResult = await advancedResponse.json();
          console.log("Advanced data:", advancedResult.data);
          setAdvancedData(advancedResult.data);
        }
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const BlurredOverlay = () => (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
      <div className="text-white text-lg font-semibold mb-2">Pro Feature</div>
      <button
        onClick={() => navigate("/upgrade")}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Upgrade Now
      </button>
    </div>
  );

  const calculateSavings = () => {
    if (!basicData) return { netSavings: 0, savingsRate: 0 };
    const netSavings = basicData.total_income - basicData.total_expenses;
    return {
      netSavings,
      savingsRate: basicData.savings_rate || 0,
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderSpendingInsights = () => {
    if (!basicData?.insights?.length) {
      return (
        <div className="text-gray-400 text-center py-4">
          No spending data available for analysis
        </div>
      );
    }

    const mostChanged = basicData.insights[0]; // Biggest change
    const unusualSpending = basicData.insights.filter((i) => i.is_unusual);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-3">Monthly Comparison</h3>
          <p
            className={`${
              mostChanged.percent_change > 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {mostChanged.category} spending{" "}
            {mostChanged.percent_change > 0 ? "increased" : "decreased"} by{" "}
            {Math.abs(mostChanged.percent_change).toFixed(1)}% from last month
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-3">Category Analysis</h3>
          <p className="text-white">
            {unusualSpending.length > 0
              ? `Unusual spending in ${unusualSpending
                  .map((i) => i.category)
                  .join(", ")}`
              : "No unusual spending patterns detected"}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-3">Unusual Spending</h3>
          {unusualSpending.length > 0 ? (
            <>
              <p
                className={`${
                  unusualSpending[0].percent_change > 0
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {unusualSpending[0].category} spending is{" "}
                {Math.abs(unusualSpending[0].percent_change).toFixed(1)}%{" "}
                {unusualSpending[0].percent_change > 0 ? "higher" : "lower"}{" "}
                than last month
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Amount: {formatCurrency(unusualSpending[0].current_amount)}
              </p>
            </>
          ) : (
            <p className="text-green-500">No unusual spending detected</p>
          )}
        </div>
      </div>
    );
  };

  const renderTrendChart = () => {
    if (!advancedData?.monthly_trends?.length) {
      return (
        <div className="text-gray-400 text-center py-4">
          No trend data available
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={advancedData.monthly_trends}
          margin={{ top: 10, right: 30, left: 70, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            tickFormatter={(value) => `₱${value.toLocaleString()}`}
            width={65}
          />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            labelFormatter={(label) => `Period: ${label}`}
            contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#9CA3AF" }}
          />
          <Line
            type="monotone"
            dataKey="monthly_income"
            name="Income"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="monthly_expenses"
            name="Expenses"
            stroke="#EF4444"
            strokeWidth={2}
            dot={{ fill: "#EF4444", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (loading) return <div className="text-white">Loading analytics...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Total Income</h3>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(basicData?.total_income || 0)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Total Expenses</h3>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(basicData?.total_expenses || 0)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Net Savings</h3>
            <p
              className={`text-2xl font-bold ${
                calculateSavings().netSavings >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {formatCurrency(Math.abs(calculateSavings().netSavings))}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Savings Rate</h3>
            <p
              className={`text-2xl font-bold ${
                calculateSavings().savingsRate >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {calculateSavings().savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Spending Insights
          </h2>
          {renderSpendingInsights()}
        </div>
        <div className="flex justify-end mb-6">
          {hasPro && (
            <ExportAnalytics
              basicData={basicData}
              advancedData={advancedData}
              user={user}
            />
          )}
        </div>
        {/* Pro Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 relative">
            <h3 className="text-white text-lg font-semibold mb-4">
              Income vs Expenses
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={advancedData?.monthly_trends || []}
                  margin={{ top: 10, right: 30, left: 70, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                    width={65}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Period: ${label}`}
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "none",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#9CA3AF" }}
                  />
                  <Bar
                    dataKey="monthly_income"
                    name="Income"
                    fill="#10B981"
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="monthly_expenses"
                    name="Expenses"
                    fill="#EF4444"
                    maxBarSize={50}
                    minPointSize={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!hasPro && <BlurredOverlay />}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 relative">
            <h3 className="text-white text-lg font-semibold mb-4">
              Expenses by Category
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={advancedData?.category_breakdown || []}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    minAngle={15}
                  >
                    {(advancedData?.category_breakdown || []).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "none",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#9CA3AF" }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: "#9CA3AF", fontSize: "12px" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {!hasPro && <BlurredOverlay />}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 relative">
          <h3 className="text-white text-lg font-semibold mb-4">
            Income & Expenses Trend
          </h3>
          <div className="h-96">
            {hasPro ? (
              renderTrendChart()
            ) : (
              <>
                {renderTrendChart()}
                <BlurredOverlay />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
