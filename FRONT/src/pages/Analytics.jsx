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
  "#9333EA", // Entertainment
  "#A855F7", // Food
  "#B45BF8", // Healthcare
  "#C084FC", // Housing
  "#C688FD", // Other Expenses
  "#D8B4FE", // Transportation
  "#E9D5FF", // Utilities
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

    const totalIncome = basicData.total_income || 0;
    const totalExpenses = basicData.total_expenses || 0;
    const netSavings = totalIncome - totalExpenses;

    // Calculate savings rate only if there's income
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      netSavings,
      savingsRate,
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

    const totalIncome = basicData.total_income || 0;

    // Only consider expenses that are significant relative to income
    const significantInsights = basicData.insights
      .filter((insight) => {
        // Calculate what percentage of income this expense represents
        const percentOfIncome = (insight.current_amount / totalIncome) * 100;

        return (
          // Expense is more than 50% of income
          percentOfIncome > 50 ||
          // OR expense has increased significantly (>50%) AND is at least 20% of income
          (Math.abs(insight.percent_change) > 50 && percentOfIncome > 20)
        );
      })
      .sort((a, b) => {
        // Sort by percentage of income
        const aPercent = (a.current_amount / totalIncome) * 100;
        const bPercent = (b.current_amount / totalIncome) * 100;
        return bPercent - aPercent;
      });

    if (!significantInsights.length) {
      return (
        <div className="text-gray-400 text-center py-4">
          No significant spending detected relative to your income
        </div>
      );
    }

    const mostChanged = significantInsights[0]; // Biggest relative to income
    const unusualSpending = significantInsights.filter(
      (i) => (i.current_amount / totalIncome) * 100 > 50
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-3">Monthly Comparison</h3>
          <p
            className={`${
              mostChanged.percent_change > 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {mostChanged.category} spending is{" "}
            {((mostChanged.current_amount / totalIncome) * 100).toFixed(1)}% of
            your income
            {mostChanged.percent_change !== 0 && (
              <span className="block mt-1 text-sm">
                ({mostChanged.percent_change > 0 ? "increased" : "decreased"} by{" "}
                {Math.abs(mostChanged.percent_change).toFixed(1)}% from last
                month)
              </span>
            )}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-3">Category Analysis</h3>
          <p className="text-white">
            {unusualSpending.length > 0
              ? `High spending categories: ${unusualSpending
                  .map(
                    (i) =>
                      `${i.category} (${(
                        (i.current_amount / totalIncome) *
                        100
                      ).toFixed(1)}% of income)`
                  )
                  .join(", ")}`
              : "No categories exceed 50% of your income"}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-3">Unusual Spending</h3>
          {unusualSpending.length > 0 ? (
            <>
              <p className="text-red-500">
                {unusualSpending[0].category} spending is{" "}
                {(
                  (unusualSpending[0].current_amount / totalIncome) *
                  100
                ).toFixed(1)}
                % of your income
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Amount: {formatCurrency(unusualSpending[0].current_amount)}
              </p>
            </>
          ) : (
            <p className="text-green-500">
              All spending categories are below 50% of your income
            </p>
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
            contentStyle={{
              backgroundColor: "#ef4444",
              border: "none",
              padding: "4px 8px",
              borderRadius: "0px",
            }}
            itemStyle={{
              color: "#fff",
              fontSize: "14px",
              padding: "0",
            }}
            labelStyle={{
              color: "#fff",
              fontSize: "14px",
              padding: "0",
            }}
            separator=": "
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
              {formatCurrency(calculateSavings().netSavings)}
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
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
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
                      borderRadius: "8px",
                      padding: "8px 12px",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
            <h2 className="text-white text-xl font-semibold mb-6">
              Expenses by Category
            </h2>
            <div className="h-[400px]">
              {!advancedData?.category_breakdown ||
              advancedData.category_breakdown.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400 text-center">
                    No expense data available yet. Start adding expenses to see
                    your spending breakdown.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={advancedData.category_breakdown}
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      minAngle={15}
                    >
                      {advancedData.category_breakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#ef4444",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "0px",
                      }}
                      itemStyle={{
                        color: "#fff",
                        fontSize: "14px",
                        padding: "0",
                      }}
                      labelStyle={{
                        color: "#fff",
                        fontSize: "14px",
                        padding: "0",
                      }}
                      separator=": "
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{
                        paddingLeft: "20px",
                        fontSize: "14px",
                      }}
                      formatter={(value) => (
                        <span style={{ color: "#9CA3AF" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
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
