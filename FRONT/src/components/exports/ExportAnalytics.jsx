import { useState, useRef } from "react";
import { CloudArrowDownIcon } from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import { Chart } from "chart.js/auto";

const COLORS = {
  income: [16, 185, 129],
  expense: [239, 68, 68],
  text: [60, 60, 60],
  purple: [103, 58, 183],
  chartColors: [
    "rgba(103, 58, 183, 0.7)",
    "rgba(16, 185, 129, 0.7)",
    "rgba(239, 68, 68, 0.7)",
    "rgba(251, 191, 36, 0.7)",
    "rgba(59, 130, 246, 0.7)",
    "rgba(236, 72, 153, 0.7)",
    "rgba(167, 139, 250, 0.7)",
  ],
};

const ExportAnalytics = ({ user }) => {
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const fetchData = async () => {
    try {
      const [
        recentExpensesRes,
        recentIncomeRes,
        allExpensesRes,
        allIncomeRes,
        goalsRes,
      ] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/expenses/recent`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL}/income/recent`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL}/expenses`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL}/income`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL}/goals`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      const [recentExpenses, recentIncome, allExpenses, allIncome, goals] =
        await Promise.all([
          recentExpensesRes.json(),
          recentIncomeRes.json(),
          allExpensesRes.json(),
          allIncomeRes.json(),
          goalsRes.json(),
        ]);

      return {
        recentExpenses: recentExpenses.expenses,
        recentIncome: recentIncome.incomes,
        allExpenses: allExpenses.expenses,
        allIncome: allIncome.incomes,
        goals: goals.goals,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  const drawAllTransactionsTable = (pdf, startY, transactions, title) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;

    // Adjust column widths to better fit content
    const colWidths = {
      date: (pageWidth - margin * 2) * 0.15, // 15% for date
      description: (pageWidth - margin * 2) * 0.45, // 45% for description
      category: (pageWidth - margin * 2) * 0.2, // 20% for category
      amount: (pageWidth - margin * 2) * 0.2, // 20% for amount
    };

    // Title
    pdf.setFont("times", "bold");
    pdf.setTextColor(...COLORS.purple);
    pdf.setFontSize(14);
    pdf.text(title, margin, startY);

    // Table header
    const headers = ["Date", "Description", "Category", "Amount"];
    startY += 10;

    // Header background
    pdf.setFillColor(245, 245, 250);
    pdf.rect(margin, startY, pageWidth - margin * 2, 10, "F");

    // Header text
    pdf.setFont("times", "bold");
    pdf.setTextColor(...COLORS.text);
    pdf.setFontSize(11);

    let currentX = margin;
    headers.forEach((header, i) => {
      pdf.text(header, currentX, startY + 7);
      currentX += Object.values(colWidths)[i];
    });

    // Table content
    pdf.setFont("times", "normal");
    const rowHeight = 12;

    transactions.forEach((transaction, index) => {
      const y = startY + 15 + index * rowHeight;
      currentX = margin;

      // Date
      pdf.text(
        new Date(transaction.created_at).toLocaleDateString("en-PH"),
        currentX,
        y
      );
      currentX += colWidths.date;

      // Description - truncate if too long
      const description = transaction.description || "-";
      const truncatedDesc = pdf.splitTextToSize(
        description,
        colWidths.description - 5
      )[0];
      pdf.text(truncatedDesc, currentX, y);
      currentX += colWidths.description;

      // Category
      const category = transaction.category_name || "-";
      const truncatedCat = pdf.splitTextToSize(
        category,
        colWidths.category - 5
      )[0];
      pdf.text(truncatedCat, currentX, y);
      currentX += colWidths.category;

      // Amount
      pdf.setTextColor(
        ...(title.includes("Income") ? COLORS.income : COLORS.expense)
      );
      pdf.text(formatCurrency(transaction.amount), currentX, y);
      pdf.setTextColor(...COLORS.text);
    });

    return startY + 25 + transactions.length * rowHeight;
  };

  const drawGoalsSection = (pdf, startY, goals) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const colWidth = (pageWidth - margin * 2) / 4; // 4 columns

    // Title
    pdf.setFont("times", "bold");
    pdf.setTextColor(...COLORS.purple);
    pdf.setFontSize(14);
    pdf.text("Financial Goals", margin, startY);

    startY += 10;

    if (!goals || goals.length === 0) {
      // No goals message
      pdf.setFont("times", "normal");
      pdf.setTextColor(...COLORS.text);
      pdf.setFontSize(11);
      pdf.text("You have no goals set...", margin, startY + 7);
      return startY + 20;
    }

    // Table header
    const headers = ["Goal", "Target Amount", "Current Amount", "Due Date"];

    // Header background
    pdf.setFillColor(245, 245, 250);
    pdf.rect(margin, startY, pageWidth - margin * 2, 10, "F");

    // Header text
    pdf.setFont("times", "bold");
    pdf.setTextColor(...COLORS.text);
    pdf.setFontSize(11);

    headers.forEach((header, i) => {
      pdf.text(header, margin + i * colWidth, startY + 7);
    });

    // Table content
    pdf.setFont("times", "normal");
    const rowHeight = 12;

    goals.forEach((goal, index) => {
      const y = startY + 15 + index * rowHeight;

      // Goal Description
      pdf.text(goal.description || "-", margin, y);

      // Target Amount
      pdf.text(formatCurrency(goal.amount), margin + colWidth, y);

      // Current Amount
      pdf.text(
        formatCurrency(goal.current_amount || 0),
        margin + colWidth * 2,
        y
      );

      // Due Date
      pdf.text(
        new Date(goal.target_date).toLocaleDateString("en-PH"),
        margin + colWidth * 3,
        y
      );
    });

    return startY + 25 + goals.length * rowHeight;
  };

  const createChart = (type, data, options) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type,
      data,
      options: {
        ...options,
        animation: false,
        responsive: false,
        plugins: {
          ...options.plugins,
          title: {
            ...options.plugins?.title,
            font: {
              ...options.plugins?.title?.font,
              family: "'Times New Roman', Times, serif",
            },
          },
          legend: {
            ...options.plugins?.legend,
            labels: {
              ...options.plugins?.legend?.labels,
              font: {
                family: "'Times New Roman', Times, serif",
              },
            },
          },
        },
        scales: {
          ...options.scales,
          y: {
            ...options.scales?.y,
            ticks: {
              ...options.scales?.y?.ticks,
              font: {
                family: "'Times New Roman', Times, serif",
              },
            },
          },
          x: {
            ...options.scales?.x,
            ticks: {
              ...options.scales?.x?.ticks,
              font: {
                family: "'Times New Roman', Times, serif",
              },
            },
          },
        },
      },
    });

    return canvas.toDataURL("image/png");
  };

  const createIncomeVsExpensesChart = (income, expenses) => {
    // Group transactions by month
    const monthlyData = {};

    [...income, ...expenses].forEach((transaction) => {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.toLocaleString("default", {
        month: "short",
      })} ${date.getFullYear()}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (income.includes(transaction)) {
        monthlyData[monthKey].income += parseFloat(transaction.amount);
      } else {
        monthlyData[monthKey].expenses += parseFloat(transaction.amount);
      }
    });

    // Convert to array and sort by date
    const sortedData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    return createChart(
      "bar",
      {
        labels: sortedData.map((d) => d.month),
        datasets: [
          {
            label: "Income",
            data: sortedData.map((d) => d.income),
            backgroundColor: "rgba(16, 185, 129, 0.7)", // Green for Income
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 1,
          },
          {
            label: "Expenses",
            data: sortedData.map((d) => d.expenses),
            backgroundColor: "rgba(239, 68, 68, 0.7)", // Red for Expenses
            borderColor: "rgb(239, 68, 68)",
            borderWidth: 1,
          },
        ],
      },
      {
        plugins: {
          title: {
            display: true,
            text: "Income vs Expenses",
            font: { size: 16 },
          },
          legend: {
            position: "bottom",
          },
          datalabels: {
            display: false, // Hide data labels to match the reference image
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(55, 65, 81, 0.3)", // Lighter grid lines
              drawBorder: false,
            },
            ticks: {
              callback: (value) => `₱${(value / 1000000000).toFixed(0)}B`,
              color: "#9CA3AF",
            },
          },
          x: {
            grid: {
              display: false, // No vertical grid lines
            },
            ticks: {
              color: "#9CA3AF",
              maxRotation: -45,
              minRotation: -45,
            },
          },
        },
        barPercentage: 0.8,
        categoryPercentage: 0.9,
        maintainAspectRatio: false,
      }
    );
  };

  const createExpensesByCategoryChart = (expenses) => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category_name || "Uncategorized";
      acc[category] = (acc[category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    return createChart(
      "pie",
      {
        labels: Object.keys(categoryTotals),
        datasets: [
          {
            data: Object.values(categoryTotals),
            backgroundColor: COLORS.chartColors,
            borderColor: COLORS.chartColors.map((color) =>
              color.replace("0.7", "1")
            ),
            borderWidth: 1,
          },
        ],
      },
      {
        plugins: {
          title: {
            display: true,
            text: "Expenses by Category",
            font: { size: 16 },
          },
          legend: {
            position: "bottom",
            labels: {
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label}: ${formatCurrency(data.datasets[0].data[i])}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                }));
              },
            },
          },
          datalabels: {
            color: "#fff",
            font: { size: 12, weight: "bold" },
            formatter: (value, ctx) => {
              const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value * 100) / sum).toFixed(1) + "%";
              return percentage;
            },
            anchor: "center",
            align: "center",
          },
        },
      }
    );
  };

  const createTrendChart = (income, expenses) => {
    const monthlyData = {};

    [...income, ...expenses].forEach((transaction) => {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (income.includes(transaction)) {
        monthlyData[monthKey].income += parseFloat(transaction.amount);
      } else {
        monthlyData[monthKey].expenses += parseFloat(transaction.amount);
      }
    });

    const months = Object.keys(monthlyData).sort();

    return createChart(
      "line",
      {
        labels: months.map((month) => {
          const [year, monthNum] = month.split("-");
          return `${new Date(year, monthNum - 1).toLocaleString("default", {
            month: "short",
          })} ${year}`;
        }),
        datasets: [
          {
            label: "Income",
            data: months.map((month) => monthlyData[month].income),
            borderColor: `rgb(${COLORS.income})`,
            backgroundColor: `rgba(${COLORS.income}, 0.1)`,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: `rgb(${COLORS.income})`,
          },
          {
            label: "Expenses",
            data: months.map((month) => monthlyData[month].expenses),
            borderColor: `rgb(${COLORS.expense})`,
            backgroundColor: `rgba(${COLORS.expense}, 0.1)`,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: `rgb(${COLORS.expense})`,
          },
        ],
      },
      {
        plugins: {
          title: {
            display: true,
            text: "Income & Expenses Trend",
            font: { size: 16 },
          },
          legend: {
            position: "bottom",
          },
          datalabels: {
            color: "#000",
            font: { size: 11 },
            formatter: (value) => formatCurrency(value),
            anchor: "end",
            align: "top",
            offset: 5,
          },
          annotation: {
            annotations: {
              periodLabel: {
                type: "label",
                xValue: months.length - 2,
                yValue:
                  Math.max(
                    ...months.map((month) =>
                      Math.max(
                        monthlyData[month].income,
                        monthlyData[month].expenses
                      )
                    )
                  ) * 0.9,
                content: [
                  `Period: ${months[months.length - 1]}`,
                  `Income: ${formatCurrency(
                    monthlyData[months[months.length - 1]].income
                  )}`,
                  `Expenses: ${formatCurrency(
                    monthlyData[months[months.length - 1]].expenses
                  )}`,
                ],
                backgroundColor: "transparent",
                color: "#9CA3AF",
                font: {
                  size: 12,
                },
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(55, 65, 81, 0.3)",
              drawBorder: false,
            },
            ticks: {
              callback: (value) => `₱${(value / 1000000000).toFixed(0)}B`,
              color: "#9CA3AF",
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#9CA3AF",
              maxRotation: -45,
              minRotation: -45,
            },
          },
        },
        maintainAspectRatio: false,
      }
    );
  };

  const drawCharts = (pdf, startY, data) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const chartWidth = pageWidth - margin * 2;
    const chartHeight = 100;

    // Income vs Expenses Chart
    const incomeVsExpensesChart = createIncomeVsExpensesChart(
      data.allIncome,
      data.allExpenses
    );
    pdf.addImage(
      incomeVsExpensesChart,
      "PNG",
      margin,
      startY,
      chartWidth,
      chartHeight
    );
    startY += chartHeight + 20;

    // Check if need new page
    if (startY > pdf.internal.pageSize.getHeight() - 120) {
      pdf.addPage();
      startY = 20;
    }

    // Expenses by Category Chart
    const expensesByCategoryChart = createExpensesByCategoryChart(
      data.allExpenses
    );
    pdf.addImage(
      expensesByCategoryChart,
      "PNG",
      margin,
      startY,
      chartWidth,
      chartHeight
    );
    startY += chartHeight + 20;

    // Check if need new page
    if (startY > pdf.internal.pageSize.getHeight() - 120) {
      pdf.addPage();
      startY = 20;
    }

    // Trend Chart
    const trendChart = createTrendChart(data.allIncome, data.allExpenses);
    pdf.addImage(trendChart, "PNG", margin, startY, chartWidth, chartHeight);

    return startY + chartHeight + 20;
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const data = await fetchData();
      if (!data) throw new Error("No data available");

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      // Set Times New Roman font
      pdf.setFont("times", "normal");

      // Page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;

      // Header background
      pdf.setFillColor(103, 58, 183);
      pdf.rect(0, 0, pageWidth, 40, "F");

      // Main title
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("times", "bold");
      pdf.setFontSize(24);
      pdf.text("Account Updates", pageWidth / 2, 20, { align: "center" });

      // Generated by and date
      pdf.setFont("times", "normal");
      pdf.setFontSize(12);
      const currentDate = new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const username = user?.username; // Get username from your auth context
      pdf.text(`Generated by: ${username}`, pageWidth / 2, 30, {
        align: "center",
      });
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 37, {
        align: "center",
      });

      let nextY = 60;

      // Recent Transactions
      nextY = drawAllTransactionsTable(
        pdf,
        nextY,
        [...data.recentExpenses, ...data.recentIncome].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        ),
        "Recent Transactions"
      );

      // Add new page for all transactions
      pdf.addPage();
      nextY = 20;

      // All Income
      nextY = drawAllTransactionsTable(
        pdf,
        nextY,
        data.allIncome.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        ),
        "All Income"
      );

      // Add spacing between tables
      nextY += 20;

      // Check if we need a new page
      if (nextY > pdf.internal.pageSize.getHeight() - 100) {
        pdf.addPage();
        nextY = 20;
      }

      // All Expenses
      nextY = drawAllTransactionsTable(
        pdf,
        nextY,
        data.allExpenses.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        ),
        "All Expenses"
      );

      // Add Goals section
      pdf.addPage();
      nextY = 20;
      nextY = drawGoalsSection(pdf, nextY, data.goals);

      // Add Charts section
      pdf.addPage();
      nextY = 20;

      // Add Charts title
      pdf.setFont("times", "bold");
      pdf.setTextColor(...COLORS.purple);
      pdf.setFontSize(14);
      pdf.text("Financial Analytics", margin, nextY);

      nextY = drawCharts(pdf, nextY + 20, data);

      pdf.save(
        `moneyup-transactions-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportToPDF}
      disabled={exporting}
      className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
    >
      <CloudArrowDownIcon className="w-5 h-5 mr-2" />
      {exporting ? "Exporting PDF..." : "Export Transactions"}
    </button>
  );
};

export default ExportAnalytics;
