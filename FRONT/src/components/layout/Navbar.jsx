import { Bars3Icon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {user && (
              <button
                onClick={onMenuClick}
                className="text-gray-400 hover:text-white focus:outline-none"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}
            <div className="ml-4 text-xl font-bold text-white">
              Money<span className="text-green-500">Up</span>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className=" font-bold text-green-500">
                  {user.username}
                </span>
                {/* <button
                  onClick={logout}
                  className="text-gray-300 hover:text-white"
                >
                  Logout
                </button> */}
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
