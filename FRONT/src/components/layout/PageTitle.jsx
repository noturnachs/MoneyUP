import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const PageTitle = () => {
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case "/":
        return "MoneyUp - Personal Finance Management";
      case "/dashboard":
        return "Dashboard | MoneyUp";
      case "/expenses":
        return "Expenses | MoneyUp";
      case "/income":
        return "Income | MoneyUp";
      case "/analytics":
        return "Analytics | MoneyUp";
      case "/goals":
        return "Financial Goals | MoneyUp";
      case "/profile":
        return "Profile | MoneyUp";
      case "/settings":
        return "Settings | MoneyUp";
      case "/login":
        return "Login | MoneyUp";
      case "/register":
        return "Register | MoneyUp";
      case "/verify-email":
        return "Verify Email | MoneyUp";
      case "/reset-password":
        return "Reset Password | MoneyUp";
      case "/forgot-password":
        return "Forgot Password | MoneyUp";
      case "/privacy":
        return "Privacy Policy | MoneyUp";
      case "/terms":
        return "Terms of Service | MoneyUp";
      default:
        return "MoneyUp";
    }
  };

  return (
    <Helmet>
      <title>{getTitle()}</title>
    </Helmet>
  );
};

export default PageTitle;
