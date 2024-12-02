import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const Navbar = ({ onMenuClick, isCollapsed, setIsSidebarOpen }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const displayUsername = user?.username;
  const subscriptionTier = user?.subscription?.tier || "free";

  const getTierColor = (tier) => {
    switch (tier) {
      case "pro":
        return "text-purple-400";
      case "enterprise":
        return "text-blue-400";
      default:
        return "text-gray-400 hover:text-purple-400 cursor-pointer";
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {user && (
              <>
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-gray-400 hover:text-white focus:outline-none md:hidden"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                {/* Desktop collapse button */}
                <button
                  onClick={onMenuClick}
                  className="text-gray-400 hover:text-white focus:outline-none hidden md:block"
                >
                  {isCollapsed ? (
                    <ChevronRightIcon className="h-6 w-6" />
                  ) : (
                    <ChevronLeftIcon className="h-6 w-6" />
                  )}
                </button>
              </>
            )}
            <div className="ml-4 text-xl font-bold text-white">
              Money<span className="text-green-500">Up</span>
            </div>
          </div>
          <div className="flex items-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-24 bg-gray-700 rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-200">
                    {displayUsername}
                  </span>
                  <span
                    className={`text-xs capitalize ${getTierColor(
                      subscriptionTier
                    )} transition-colors duration-150`}
                    onClick={() => {
                      if (subscriptionTier === "free") {
                        navigate("/upgrade");
                      }
                    }}
                  >
                    {subscriptionTier} plan {subscriptionTier === "free" && "→"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
