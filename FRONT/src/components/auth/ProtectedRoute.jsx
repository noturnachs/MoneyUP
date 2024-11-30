import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ring } from "ldrs";

ring.register();

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
