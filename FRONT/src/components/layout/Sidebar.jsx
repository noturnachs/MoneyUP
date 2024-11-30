import {
  HomeIcon,
  ChartPieIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  Cog6ToothIcon,
  BanknotesIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: HomeIcon,
      path: "/dashboard",
      description: "Overview of your finances",
    },
    {
      name: "Income",
      icon: BanknotesIcon,
      path: "/income",
      description: "Manage your income",
    },
    {
      name: "Expenses",
      icon: WalletIcon,
      path: "/expenses",
      description: "Manage your expenses",
    },
    {
      name: "Goals",
      icon: FlagIcon,
      path: "/goals",
      description: "Track your savings goals",
    },
    {
      name: "Analytics",
      icon: ChartPieIcon,
      path: "/analytics",
      description: "Financial insights",
    },
    {
      name: "Profile",
      icon: UserIcon,
      path: "/profile",
      description: "Your account settings",
    },
    {
      name: "Settings",
      icon: Cog6ToothIcon,
      path: "/settings",
      description: "Manage balance alerts", // Added description to match format
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`${isOpen ? "translate-x-0" : "-translate-x-full"} 
        fixed inset-y-0 left-0 transform transition-all duration-300 ease-in-out 
        ${isCollapsed ? "w-20" : "w-64"} bg-gray-800 border-r border-gray-700 
        z-30 md:relative md:translate-x-0 h-screen md:h-[calc(100vh-64px)]
        flex flex-col`}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-700">
          <span className="text-white font-medium">Menu</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Collapse Button - Hidden on Mobile */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-gray-800 text-gray-400 
          hover:text-white p-1 rounded-full border border-gray-700 
          hover:border-gray-600 focus:outline-none hidden md:block"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose} // Close sidebar on mobile when clicking a link
                className={`flex items-center ${
                  isCollapsed ? "justify-center" : "px-4"
                } py-3 text-gray-300 rounded-lg transition-colors group relative
                ${
                  isActive(item.path)
                    ? "bg-purple-600 text-white"
                    : "hover:bg-gray-700"
                }`}
                title={isCollapsed ? item.name : ""}
              >
                <item.icon
                  className={`h-5 w-5 ${!isCollapsed && "mr-3"} ${
                    isActive(item.path)
                      ? "text-white"
                      : "text-gray-400 group-hover:text-white"
                  }`}
                />
                {(!isCollapsed || isOpen) && <span>{item.name}</span>}

                {/* Tooltip - Only show on desktop when collapsed */}
                {isCollapsed && !isOpen && (
                  <div
                    className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md 
                    opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 hidden md:block"
                  >
                    {item.name}
                    <div className="text-xs text-gray-400">
                      {item.description}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout button at bottom */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              onClose(); // Close sidebar first
              logout(); // Then logout
            }}
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "px-4"
            } py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors w-full group relative`}
            title={isCollapsed ? "Logout" : ""}
          >
            <ArrowLeftOnRectangleIcon
              className={`h-5 w-5 ${
                !isCollapsed && "mr-3"
              } text-gray-400 group-hover:text-white`}
            />
            {(!isCollapsed || isOpen) && <span>Logout</span>}

            {/* Tooltip - Only show on desktop when collapsed */}
            {isCollapsed && !isOpen && (
              <div
                className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 hidden md:block"
              >
                Logout
                <div className="text-xs text-gray-400">
                  Sign out of your account
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
