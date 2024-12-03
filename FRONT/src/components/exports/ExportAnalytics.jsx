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

  const createIncomeVsExpensesChart = async (income, expenses) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");

      // Destroy existing chart if it exists
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Calculate totals
      const totalIncome = income.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0
      );

      // Create new chart
      const chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Income", "Expenses"],
          datasets: [
            {
              data: [totalIncome, totalExpenses],
              backgroundColor: [
                "rgba(16, 185, 129, 0.7)",
                "rgba(239, 68, 68, 0.7)",
              ],
              borderColor: ["rgb(16, 185, 129)", "rgb(239, 68, 68)"],
              borderWidth: 1,
              barThickness: 100,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Income vs Expenses",
              font: {
                size: 20,
                weight: "bold",
                family: "'Times New Roman', Times, serif",
              },
              padding: 20,
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(156, 163, 175, 0.1)",
              },
              ticks: {
                font: {
                  size: 14,
                  family: "'Times New Roman', Times, serif",
                },
                callback: function (value) {
                  return "₱" + value.toLocaleString();
                },
              },
            },
            x: {
              grid: {
                display: false,
              },
              ticks: {
                font: {
                  size: 14,
                  family: "'Times New Roman', Times, serif",
                },
              },
            },
          },
        },
      });

      // Wait for chart to render and get image data
      return new Promise((resolve) => {
        setTimeout(() => {
          const imageData = canvas.toDataURL("image/png");
          chart.destroy(); // Clean up the chart
          resolve(imageData);
        }, 200);
      });
    } catch (error) {
      console.error("Error creating chart:", error);
      throw error;
    }
  };

  const createExpensesByCategoryChart = async (expenses) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");

      // Destroy existing chart if it exists
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Calculate category totals
      const categoryTotals = expenses.reduce((acc, expense) => {
        const category = expense.category_name || "Uncategorized";
        acc[category] = (acc[category] || 0) + parseFloat(expense.amount || 0);
        return acc;
      }, {});

      // Create new chart
      const chart = new Chart(ctx, {
        type: "pie",
        data: {
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
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Expenses by Category",
              font: {
                size: 20,
                weight: "bold",
                family: "'Times New Roman', Times, serif",
              },
              padding: 20,
            },
            legend: {
              position: "bottom",
              labels: {
                font: {
                  size: 12,
                  family: "'Times New Roman', Times, serif",
                },
                generateLabels: (chart) => {
                  const data = chart.data;
                  return data.labels.map((label, i) => ({
                    text: `${label}: ${formatCurrency(
                      data.datasets[0].data[i]
                    )}`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor[i],
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                  }));
                },
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value * 100) / total).toFixed(1);
                  return `${context.label}: ${formatCurrency(
                    value
                  )} (${percentage}%)`;
                },
              },
            },
          },
        },
      });

      // Wait for chart to render and get image data
      return new Promise((resolve) => {
        setTimeout(() => {
          const imageData = canvas.toDataURL("image/png");
          chart.destroy(); // Clean up the chart
          resolve(imageData);
        }, 200);
      });
    } catch (error) {
      console.error("Error creating category chart:", error);
      throw error;
    }
  };

  const createTrendChart = async (income, expenses) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Process data by month
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
          monthlyData[monthKey].income += parseFloat(transaction.amount || 0);
        } else {
          monthlyData[monthKey].expenses += parseFloat(transaction.amount || 0);
        }
      });

      const months = Object.keys(monthlyData).sort();

      // Calculate month-over-month changes
      const currentMonth = months[months.length - 1];
      const previousMonth = months[months.length - 2];

      const comparison = {
        income: {
          current: monthlyData[currentMonth]?.income || 0,
          previous: monthlyData[previousMonth]?.income || 0,
          change: 0,
          percentage: 0,
        },
        expenses: {
          current: monthlyData[currentMonth]?.expenses || 0,
          previous: monthlyData[previousMonth]?.expenses || 0,
          change: 0,
          percentage: 0,
        },
      };

      // Calculate changes and percentages
      comparison.income.change =
        comparison.income.current - comparison.income.previous;
      comparison.income.percentage = comparison.income.previous
        ? (
            (comparison.income.change / comparison.income.previous) *
            100
          ).toFixed(1)
        : 0;

      comparison.expenses.change =
        comparison.expenses.current - comparison.expenses.previous;
      comparison.expenses.percentage = comparison.expenses.previous
        ? (
            (comparison.expenses.change / comparison.expenses.previous) *
            100
          ).toFixed(1)
        : 0;

      // Create new chart
      const chart = new Chart(ctx, {
        type: "line",
        data: {
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
        options: {
          responsive: false,
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: 10,
              right: 10,
              top: 20,
              bottom: 80, // Increased for comparison text
            },
          },
          plugins: {
            title: {
              display: true,
              text: [
                "Income & Expenses Trend",
                " ", // Empty line for spacing
                `Month-over-Month Comparison:`,
                `Income: ${
                  comparison.income.change >= 0 ? "+" : ""
                }₱${comparison.income.change.toLocaleString()} (${
                  comparison.income.percentage
                }% from previous month)`,
                `Expenses: ${
                  comparison.expenses.change >= 0 ? "+" : ""
                }₱${comparison.expenses.change.toLocaleString()} (${
                  comparison.expenses.percentage
                }% from previous month)`,
              ],
              font: {
                size: 14,
                weight: "bold",
                family: "'Times New Roman', Times, serif",
              },
              padding: 20,
            },
            legend: {
              position: "bottom",
              labels: {
                font: {
                  size: 12,
                  family: "'Times New Roman', Times, serif",
                },
                padding: 20,
              },
            },
            datalabels: {
              display: true,
              color: "#666",
              align: "top",
              offset: 10,
              font: {
                size: 11,
                family: "'Times New Roman', Times, serif",
              },
              formatter: (value) => `₱${value.toLocaleString()}`,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(156, 163, 175, 0.1)",
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Times New Roman', Times, serif",
                },
                callback: function (value) {
                  return "₱" + value.toLocaleString();
                },
              },
            },
            x: {
              grid: {
                display: false,
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Times New Roman', Times, serif",
                },
                maxRotation: 45,
                minRotation: 45,
                display: true,
                autoSkip: false,
                padding: 10,
              },
            },
          },
        },
      });

      // Wait for chart to render and get image data
      return new Promise((resolve) => {
        setTimeout(() => {
          const imageData = canvas.toDataURL("image/png");
          chart.destroy();
          resolve(imageData);
        }, 200);
      });
    } catch (error) {
      console.error("Error creating trend chart:", error);
      throw error;
    }
  };

  const drawCharts = async (pdf, startY, data) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const chartWidth = pageWidth - margin * 2;
    const chartHeight = 120;

    try {
      // Income vs Expenses Chart
      const incomeVsExpensesChart = await createIncomeVsExpensesChart(
        data.allIncome,
        data.allExpenses
      );

      pdf.setFont("times", "bold");
      pdf.setTextColor(...COLORS.text);
      pdf.setFontSize(12);

      if (incomeVsExpensesChart) {
        pdf.addImage(
          incomeVsExpensesChart,
          "PNG",
          margin,
          startY,
          chartWidth,
          chartHeight
        );
        startY += chartHeight + 30;
      }

      // Check if need new page
      if (startY > pdf.internal.pageSize.getHeight() - 140) {
        pdf.addPage();
        startY = 20;
      }

      // Expenses by Category Chart
      const expensesByCategoryChart = await createExpensesByCategoryChart(
        data.allExpenses
      );

      if (expensesByCategoryChart) {
        pdf.addImage(
          expensesByCategoryChart,
          "PNG",
          margin,
          startY,
          chartWidth,
          chartHeight
        );
        startY += chartHeight + 30;
      }

      // Check if need new page
      if (startY > pdf.internal.pageSize.getHeight() - 140) {
        pdf.addPage();
        startY = 20;
      }

      // Trend Chart
      const trendChart = await createTrendChart(
        data.allIncome,
        data.allExpenses
      );

      if (trendChart) {
        pdf.addImage(
          trendChart,
          "PNG",
          margin,
          startY,
          chartWidth,
          chartHeight
        );
        startY += chartHeight + 30;
      }

      return startY;
    } catch (error) {
      console.error("Error drawing charts:", error);
      return startY;
    }
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
      nextY += 20; // Add some spacing after goals
      nextY = await drawCharts(pdf, nextY, data);

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
      {exporting ? "Exporting PDF..." : "Export Transactions as PDF"}
    </button>
  );
};

export default ExportAnalytics;
