import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const Navbar = ({ onMenuClick, isCollapsed, setIsSidebarOpen }) => {
  const { user, loading } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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

  const UpgradeModal = () => (
    <Transition appear show={isUpgradeModalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => setIsUpgradeModalOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white mb-4"
                >
                  Upgrade to Pro Plan
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-gray-300 mb-4">
                    To upgrade to our Pro plan, please follow these steps:
                  </p>
                  <ol className="list-decimal list-inside text-gray-300 space-y-2">
                    <li>
                      Send ₱299 via GCash to:{" "}
                      <span className="font-semibold text-white">
                        09062130621
                      </span>
                    </li>
                    <li>Take a screenshot of your payment</li>
                    <li>
                      Send the screenshot to:{" "}
                      <span className="font-semibold text-white">
                        support@example.com
                      </span>
                    </li>
                    <li>
                      Include your email:{" "}
                      <span className="font-semibold text-white">
                        {user?.email}
                      </span>
                    </li>
                  </ol>
                  <p className="mt-4 text-sm text-gray-400">
                    We'll upgrade your account within 24 hours after payment
                    verification.
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    onClick={() => setIsUpgradeModalOpen(false)}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

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
                        setIsUpgradeModalOpen(true);
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
      <UpgradeModal />
    </nav>
  );
};

export default Navbar;
