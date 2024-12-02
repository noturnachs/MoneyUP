import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useState } from "react";
import { ring } from "ldrs";
import { HelmetProvider } from "react-helmet-async";

// Import pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Income from "./pages/Income";
import Settings from "./pages/Settings";
import Goals from "./pages/Goals";
import Upgrade from "./pages/Upgrade";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Import components
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import PageTitle from "./components/layout/PageTitle";

// Import context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

ring.register();

// Layout wrapper component
const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { isLoading } = useAuth();

  // List of routes where we don't want to show the sidebar/navbar
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/verify-email",
    "/reset-password",
    "/forgot-password",
    "/privacy",
    "/terms",
  ];
  const isPublicRoute =
    publicRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/privacy") ||
    location.pathname.startsWith("/terms") ||
    location.pathname.startsWith("/verify-email") ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname.startsWith("/forgot-password");

  // Show loading spinner while auth is being checked
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <l-ring
          size="40"
          stroke="5"
          bg-opacity="0"
          speed="2"
          color="rgb(147, 51, 234)"
        />
        <span className="mt-4 text-gray-400">Loading...</span>
      </div>
    );
  }

  if (isPublicRoute) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PageTitle />
      <Navbar
        onMenuClick={() => setIsCollapsed(!isCollapsed)}
        isCollapsed={isCollapsed}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex h-[calc(100vh-64px)] relative">
        <div className="z-[1]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

// Wrap AppLayout with auth context consumer
const AppLayoutWithAuth = ({ children }) => {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <PageTitle />
          <AppLayoutWithAuth>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <PublicRoute>
                    <VerifyEmail />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upgrade"
                element={
                  <ProtectedRoute>
                    <Upgrade />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <Expenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/income"
                element={
                  <ProtectedRoute>
                    <Income />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route for 404 - Optional */}
              <Route
                path="*"
                element={
                  <div className="text-center py-20">
                    <h1 className="text-4xl font-bold text-gray-200">404</h1>
                    <p className="text-gray-400">Page not found</p>
                  </div>
                }
              />

              <Route
                path="/privacy"
                element={
                  <PublicRoute>
                    <Privacy />
                  </PublicRoute>
                }
              />
              <Route
                path="/terms"
                element={
                  <PublicRoute>
                    <Terms />
                  </PublicRoute>
                }
              />
            </Routes>
          </AppLayoutWithAuth>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
