import {
  HomeIcon,
  ChartPieIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen }) => {
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
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className={`${isOpen ? "translate-x-0" : "-translate-x-full"} 
      fixed inset-y-0 left-0 transform transition-all duration-300 ease-in-out 
      ${isCollapsed ? "w-20" : "w-64"} bg-gray-800 border-r border-gray-700 
      z-30 md:relative md:translate-x-0 h-[calc(100vh-64px)] relative`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-gray-800 text-gray-400 
        hover:text-white p-1 rounded-full border border-gray-700 
        hover:border-gray-600 focus:outline-none"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" />
        )}
      </button>

      <div className="flex flex-col h-full">
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
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
                {!isCollapsed && <span>{item.name}</span>}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
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
            onClick={logout}
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
            {!isCollapsed && <span>Logout</span>}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Logout
                <div className="text-xs text-gray-400">
                  Sign out of your account
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
