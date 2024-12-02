import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PayPalButton from "../components/payments/PaypalButton";

const plans = [
  {
    name: "Basic",
    price: "Free",
    features: [
      "Basic Expense Tracking",
      "Monthly Summary Analytics",
      "Up to 3 Months History",
      "Basic Categories",
    ],
    cta: "Select Basic",
    featured: true,
  },
  {
    name: "Pro",
    price: "₱299",
    period: "/month",
    features: [
      "Unlimited History",
      "Advanced Analytics & Reports",
      "Custom Categories & Tags",
      "Data Export (CSV/PDF)",
      "Budget Goals & Alerts",
      "Recurring Expenses",
    ],
    cta: "Select Pro",
    featured: false,
  },
];

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: location.state?.plan || "basic",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Only clear username-related errors when typing in username field
    if (name === "username") {
      setUsernameAvailable(null);
      setError("");
    }
    // Clear password match error when typing in password fields
    if (name === "password" || name === "confirmPassword") {
      if (error === "Passwords do not match") {
        setError("");
      }
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/check-availability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field: "username",
            value: username,
          }),
        }
      );

      const data = await response.json();
      setUsernameAvailable(data.available);
      if (!data.available) {
        setError("Username is already taken");
      } else {
        setError("");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handlePayPalSuccess = async (paymentDetails) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/payments/verify-paypal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderID: paymentDetails.id,
            registrationData: formData,
            paymentDetails: paymentDetails,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        navigate("/login", {
          state: {
            message:
              "Registration and payment successful! Please check your email to verify your account.",
          },
        });
      } else {
        setError(data.message || "Payment verification failed");
      }
    } catch (error) {
      setError("An error occurred during payment verification");
      console.error("Payment verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Password validations only on submit
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      setIsLoading(false);
      return;
    }

    if (formData.plan === "pro") {
      setShowPayPal(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            plan: formData.plan,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        navigate("/login", {
          state: {
            message:
              "Registration successful! Please check your email to verify your account.",
          },
        });
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (error) {
      setError("An error occurred during registration");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to check if the form is valid
  const isFormValid = () => {
    // Return false if there are any errors
    if (error) return false;
    // Return false if username is taken or being checked
    if (!usernameAvailable || isCheckingUsername) return false;
    // Return false if passwords don't match
    if (formData.password !== formData.confirmPassword) return false;
    // Return false if any required field is empty
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-950 border border-red-500 text-red-400 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={(e) => checkUsernameAvailability(e.target.value)}
                  className={`appearance-none rounded-lg relative block w-full px-3 py-2 border 
                    ${
                      !usernameAvailable && usernameAvailable !== null
                        ? "border-red-500"
                        : "border-gray-700"
                    } 
                    ${usernameAvailable ? "border-green-500" : ""}
                    bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm`}
                  placeholder="Username"
                  required
                />
                {isCheckingUsername && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                )}
                {!isCheckingUsername && usernameAvailable !== null && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {usernameAvailable ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-200">
                Select Plan
              </label>
              <div className="grid grid-cols-2 gap-8">
                {plans.slice(0, 2).map((plan) => (
                  <button
                    key={plan.name}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        plan: plan.name.toLowerCase(),
                      }))
                    }
                    className={`p-8 rounded-lg text-left ${
                      formData.plan === plan.name.toLowerCase()
                        ? "bg-purple-900/50 border-2 border-purple-500"
                        : "bg-gray-900/50 border border-gray-700 hover:border-purple-400"
                    } transition-all duration-200`}
                  >
                    <h3 className="text-2xl font-bold text-white">
                      {plan.name}
                    </h3>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-white">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-400 ml-1">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-purple-300 uppercase tracking-wider">
                        WHAT'S INCLUDED
                      </h4>
                      <ul className="mt-4 space-y-3">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center text-gray-300 text-sm"
                          >
                            <svg
                              className="flex-shrink-0 h-5 w-5 text-green-500 mr-3"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400 text-center">
            <p>By registering, you agree to our terms of service.</p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>

          <div className="text-center text-sm mt-4">
            <span className="text-gray-400">Already have an account?</span>{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-medium text-purple-500 hover:text-purple-400 focus:outline-none focus:underline transition ease-in-out duration-150"
            >
              Sign in
            </button>
          </div>

          {showPayPal && (
            <div className="mt-4">
              <PayPalButton
                amount="299.00"
                onSuccess={handlePayPalSuccess}
                onCancel={() => setShowPayPal(false)}
                registrationData={formData}
              />
              <button
                onClick={() => setShowPayPal(false)}
                className="mt-4 w-full text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
