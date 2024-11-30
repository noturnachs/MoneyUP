import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import Pricing from "./Pricing";

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
  ];

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">MoneyUp</span>
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
      <div className="relative overflow-hidden">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 transition-all duration-700 ease-out transform ${
            isVisible.hero
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block">Take Control of Your</span>
              <span className="block text-purple-500">Financial Future</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Track expenses, manage budgets, and achieve your financial goals
              with our intuitive personal finance management tool.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                to="/register"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 md:text-lg transition-colors"
              >
                Start Free Today
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 transition-all duration-700 ease-out transform ${
            isVisible.features
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Everything you need to manage your money
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Simple yet powerful tools to help you make better financial
              decisions.
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`pt-6 transition-all duration-700 ease-out transform delay-${
                    index * 100
                  }`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                    opacity: isVisible.features ? 1 : 0,
                    transform: isVisible.features
                      ? "translateY(0)"
                      : "translateY(20px)",
                  }}
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Pricing Section here, before the CTA */}
      <div
        className={`transition-all duration-700 ease-out transform ${
          isVisible.features
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <Pricing />
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900">
        <div
          className={`max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-out transform ${
            isVisible.cta
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="bg-purple-600 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
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
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 pt-8 flex justify-between items-center">
            <p className="text-base text-gray-400">
              &copy; 2024 MoneyUp. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="/" className="text-gray-400 hover:text-gray-300">
                Privacy
              </a>
              <a href="/" className="text-gray-400 hover:text-gray-300">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
