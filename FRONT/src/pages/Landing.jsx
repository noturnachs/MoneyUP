import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useScroll, useInView } from "framer-motion";
import Pricing from "./Pricing";
import showcaseImage from "../components/images/showcase.png";
import showcase2Image from "../components/images/showcase2.png";
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

const Landing = () => {
  const { user, logout } = useAuth();
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    cta: false,
  });

  useEffect(() => {
    // Stagger the animations
    setIsVisible((prev) => ({ ...prev, hero: true }));
    setTimeout(
      () => setIsVisible((prev) => ({ ...prev, features: true })),
      300
    );
    setTimeout(() => setIsVisible((prev) => ({ ...prev, cta: true })), 600);
  }, []);

  const features = [
    {
      icon: ChartBarIcon,
      title: "Track Expenses",
      description:
        "Monitor your spending habits with detailed categorization and real-time tracking.",
    },
    {
      icon: CurrencyDollarIcon,
      title: "Budget Management",
      description:
        "Set and manage budgets for different categories to keep your finances in check.",
    },
    {
      icon: ChartPieIcon,
      title: "Visual Analytics",
      description:
        "Understand your financial patterns with intuitive charts and reports.",
    },
    {
      icon: ArrowTrendingUpIcon,
      title: "Financial Goals",
      description:
        "Set savings goals and track your progress towards achieving them.",
    },
    {
      icon: BellIcon,
      title: "Set Thresholds",
      description:
        "Stay on track with spending alerts by setting limits and receiving reminders if you exceed them.",
    },
  ];

  // Refs for scroll animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);
  const analyticsRef = useRef(null);

  // Animation controls
  const heroControls = useAnimation();
  const featuresControls = useAnimation();
  const pricingControls = useAnimation();
  const ctaControls = useAnimation();
  const analyticsControls = useAnimation();

  // Check if sections are in view
  const heroInView = useInView(heroRef, { margin: "-100px" });
  const featuresInView = useInView(featuresRef, {
    margin: "-100px 0px",
    amount: 0.1,
  });
  const pricingInView = useInView(pricingRef, { margin: "-100px" });
  const ctaInView = useInView(ctaRef, { margin: "-100px" });
  const analyticsInView = useInView(analyticsRef, {
    margin: "-100px 0px",
    amount: 0.3,
  });

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Update animations when sections come into view
  useEffect(() => {
    if (heroInView) {
      heroControls.start("visible");
    } else {
      heroControls.start("hidden");
    }
  }, [heroInView, heroControls]);

  useEffect(() => {
    if (featuresInView) {
      featuresControls.start("visible");
    } else {
      featuresControls.start("hidden");
    }
  }, [featuresInView, featuresControls]);

  useEffect(() => {
    if (pricingInView) {
      pricingControls.start("visible");
    } else {
      pricingControls.start("hidden");
    }
  }, [pricingInView, pricingControls]);

  useEffect(() => {
    if (ctaInView) {
      ctaControls.start("visible");
    } else {
      ctaControls.start("hidden");
    }
  }, [ctaInView, ctaControls]);

  useEffect(() => {
    if (analyticsInView) {
      analyticsControls.start("visible");
    } else {
      analyticsControls.start("hidden");
    }
  }, [analyticsInView, analyticsControls]);

  // Add these chart configurations inside the Landing component
  const chartData = {
    expenses: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Monthly Expenses",
          data: [2100, 1800, 2300, 1900, 2500, 2000],
          borderColor: "rgb(147, 51, 234)",
          backgroundColor: "rgba(147, 51, 234, 0.5)",
          tension: 0.4,
        },
      ],
    },
    categories: {
      labels: ["Food", "Transport", "Shopping", "Bills", "Entertainment"],
      datasets: [
        {
          label: "Spending by Category",
          data: [300, 200, 250, 450, 300],
          backgroundColor: [
            "rgba(147, 51, 234, 0.8)",
            "rgba(168, 85, 247, 0.8)",
            "rgba(192, 132, 252, 0.8)",
            "rgba(216, 180, 254, 0.8)",
            "rgba(233, 213, 255, 0.8)",
          ],
          borderWidth: 1,
        },
      ],
    },
  };

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
    },
    scales: {
      y: {
        ticks: {
          color: "#9CA3AF",
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

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">
                Money<span className="text-green-500">Up</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/dashboard"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Account
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        initial="hidden"
        animate={heroControls}
        variants={containerVariants}
        className="relative min-h-[80vh] flex items-start bg-gray-900 pt-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto w-full mt-8">
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Text Content */}
            <motion.div
              variants={itemVariants}
              className="text-center lg:text-left lg:col-span-6 mb-12 lg:mb-0"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-extrabold text-white">
                  <motion.span variants={itemVariants} className="block">
                    Take Control of
                  </motion.span>
                  <motion.span variants={itemVariants} className="block">
                    Your
                  </motion.span>
                  <motion.span
                    variants={itemVariants}
                    className="block text-purple-500"
                  >
                    Financial Future
                  </motion.span>
                </h1>
                <motion.p
                  variants={itemVariants}
                  className="mt-3 text-base sm:text-lg text-gray-300 md:mt-5 md:text-xl px-4 lg:px-0"
                >
                  Track expenses, manage budgets, and achieve your financial
                  goals with our easy-to-use personal finance management tool.
                </motion.p>
                <motion.div variants={itemVariants} className="mt-5 sm:mt-8">
                  <Link
                    to="/register"
                    className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 md:text-lg transition-colors"
                  >
                    Start Free Today
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Images */}
            <motion.div
              variants={itemVariants}
              className="relative lg:col-span-6"
            >
              <div className="relative mx-auto w-full">
                {/* First Image */}
                <motion.div
                  className="relative block w-full rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  whileHover={{
                    scale: 1.05,
                    rotate: 1,
                    transition: {
                      duration: 0.4,
                      ease: "easeOut",
                    },
                  }}
                >
                  <div className="absolute inset-0 bg-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                  <img
                    className="w-full rounded-lg transition-transform duration-300"
                    src={showcaseImage}
                    alt="Dashboard Preview"
                    style={{
                      boxShadow: "0 0 40px rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.2)",
                    }}
                  />
                  <div className="absolute inset-0 ring-1 ring-purple-500/20 rounded-lg pointer-events-none" />
                </motion.div>

                {/* Second Image */}
                <motion.div
                  className="absolute -bottom-12 -right-12 w-4/5 rounded-lg overflow-hidden hidden sm:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  whileHover={{
                    scale: 1.05,
                    rotate: -1,
                    transition: {
                      duration: 0.4,
                      ease: "easeOut",
                    },
                  }}
                >
                  <div className="absolute inset-0 bg-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                  <img
                    className="w-full rounded-lg transition-transform duration-300"
                    src={showcase2Image}
                    alt="Dashboard Features Preview"
                    style={{
                      boxShadow: "0 0 40px rgba(139, 92, 246, 0.2)",
                      border: "1px solid rgba(139, 92, 246, 0.2)",
                    }}
                  />
                  <div className="absolute inset-0 ring-1 ring-purple-500/20 rounded-lg pointer-events-none" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-4 left-0 right-0 mx-auto flex flex-col items-center justify-center text-gray-400 cursor-pointer w-full max-w-[100px]"
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.6,
              delay: 1,
            },
          }}
          whileHover={{ scale: 1.1 }}
          onClick={() => {
            const chartsSection = document.getElementById("charts-section");
            if (chartsSection) {
              chartsSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <span className="text-sm mb-1 text-center">Scroll Down</span>
          <motion.div
            className="flex justify-center"
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        ref={analyticsRef}
        id="charts-section"
        initial="hidden"
        animate={analyticsControls}
        variants={{
          hidden: {
            opacity: 0,
            y: 50,
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.6,
              ease: "easeOut",
              staggerChildren: 0.2,
            },
          },
        }}
        className="bg-gray-900 py-8 sm:py-16 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl font-extrabold text-white sm:text-4xl px-4">
              Powerful Analytics at Your Fingertips
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Visualize your finances with interactive charts and insights
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8">
            {/* Expenses Trend Chart */}
            <motion.div
              variants={itemVariants}
              className="bg-gray-800 p-6 rounded-lg shadow-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Expenses Trend
              </h3>
              <div className="h-[300px]">
                <Line data={chartData.expenses} options={chartOptions} />
              </div>
            </motion.div>

            {/* Spending by Category Chart */}
            <motion.div
              variants={itemVariants}
              className="bg-gray-800 p-6 rounded-lg shadow-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Spending by Category
              </h3>
              <div className="h-[300px]">
                <Doughnut
                  data={chartData.categories}
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
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        ref={featuresRef}
        initial="hidden"
        animate={featuresControls}
        variants={containerVariants}
        className="bg-gray-800 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto py-8 sm:py-16">
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white sm:text-4xl px-4">
              Everything you need to manage your money
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Simple yet powerful tools to help you make better financial
              decisions.
            </p>
          </motion.div>

          <div className="mt-12 sm:mt-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 20,
                      transition: { delay: index * 0.1 },
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.5,
                        delay: index * 0.1,
                      },
                    },
                  }}
                  className="pt-6"
                >
                  <div
                    className="flow-root bg-gray-900 rounded-lg px-6 pb-8 
                    transition-all duration-300 ease-in-out transform 
                    hover:scale-105 hover:-translate-y-2 
                    hover:shadow-xl hover:shadow-purple-500/10 
                    hover:border-purple-500/50 border-2 border-transparent
                    group"
                  >
                    <div className="-mt-6">
                      <div>
                        <span
                          className="inline-flex items-center justify-center p-3 
                          bg-purple-500 rounded-md shadow-lg
                          transition-all duration-300 ease-in-out
                          group-hover:bg-purple-400 group-hover:scale-110
                          group-hover:rotate-3"
                        >
                          <feature.icon
                            className="h-6 w-6 text-white transition-transform 
                              duration-300 ease-in-out group-hover:scale-110"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <h3
                        className="mt-8 text-lg font-medium text-white tracking-tight
                        transition-colors duration-300 ease-in-out
                        group-hover:text-purple-400"
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="mt-5 text-base text-gray-400
                        transition-colors duration-300 ease-in-out
                        group-hover:text-gray-300"
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Section */}
      <motion.div
        ref={pricingRef}
        initial="hidden"
        animate={pricingControls}
        variants={containerVariants}
      >
        <Pricing />
      </motion.div>

      {/* CTA Section */}
      <motion.div
        ref={ctaRef}
        initial="hidden"
        animate={ctaControls}
        variants={containerVariants}
        className="bg-gray-900 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto py-8 sm:py-12">
          <motion.div
            variants={itemVariants}
            className="bg-purple-600 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="px-4 py-8 sm:px-12 sm:py-16 space-y-6 sm:space-y-0 lg:flex lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white sm:text-4xl">
                  {user ? (
                    <span className="block">Welcome back!</span>
                  ) : (
                    <span className="block">Ready to get started?</span>
                  )}
                  <span className="block text-purple-200">
                    {user
                      ? "Continue managing your finances."
                      : "Create your free account today."}
                  </span>
                </h2>
              </div>
              <div className="flex justify-center lg:mt-0 lg:flex-shrink-0">
                <div className="inline-flex rounded-md shadow">
                  <Link
                    to={user ? "/dashboard" : "/register"}
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 transition-colors"
                  >
                    {user ? "Go to Dashboard" : "Get Started"}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-8 sm:py-12">
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm sm:text-base text-gray-400 text-center sm:text-left">
              &copy; 2024 MoneyUp. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                to="/privacy"
                className="text-sm sm:text-base text-gray-400 hover:text-gray-300"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-sm sm:text-base text-gray-400 hover:text-gray-300"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
