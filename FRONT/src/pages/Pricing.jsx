import { CheckIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const Pricing = () => {
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
      cta: "Get Started",
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
      cta: "Subscribe Now",
      featured: false,
    },
    {
      name: "Enterprise",
      price: "₱999",
      period: "/month",
      features: [
        "Coming Soon:",
        "All Pro Features",
        "API Access",
        "Multiple Users",
        "Custom Branding",
        "Priority Support",
        "Custom Reports",
      ],
      cta: "Coming Soon",
      featured: false,
    },
  ];

  return (
    <div className="bg-gray-800 py-16" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-lg bg-gray-900 divide-y divide-gray-800 
                transform transition-all duration-300 ease-in-out hover:-translate-y-2 
                hover:shadow-2xl ${
                  plan.featured
                    ? "ring-2 ring-purple-500 hover:ring-purple-400"
                    : "hover:ring-2 hover:ring-gray-600"
                }`}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white transition-colors duration-300">
                  {plan.name}
                </h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-base font-medium text-gray-400">
                      {plan.period}
                    </span>
                  )}
                </p>
                <Link
                  to={
                    plan.name === "Basic"
                      ? "/register"
                      : plan.name === "Pro"
                      ? "/register"
                      : "#"
                  }
                  state={{ plan: plan.name.toLowerCase() }}
                  className={`mt-8 block w-full py-3 px-6 rounded-md text-center font-medium 
                    transition-all duration-300 ease-in-out transform 
                    ${
                      plan.name === "Basic" || plan.name === "Pro"
                        ? "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105 hover:shadow-lg"
                        : "bg-gray-800 text-gray-400 cursor-not-allowed opacity-75"
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
              <div className="px-6 pt-6 pb-8">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex space-x-3 group transition-transform duration-300 ease-in-out hover:translate-x-1"
                    >
                      <CheckIcon
                        className="flex-shrink-0 h-5 w-5 text-green-500 transition-transform duration-300 ease-in-out group-hover:scale-110"
                        aria-hidden="true"
                      />
                      <span className="text-base text-gray-300 transition-colors duration-300 group-hover:text-white">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
