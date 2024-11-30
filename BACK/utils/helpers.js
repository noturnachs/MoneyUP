const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

const calculateBalance = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    if (transaction.type === "income") {
      return acc + parseFloat(transaction.amount);
    } else {
      return acc - parseFloat(transaction.amount);
    }
  }, 0);
};

const validateTransaction = (data) => {
  const errors = [];

  if (!data.amount || isNaN(parseFloat(data.amount))) {
    errors.push("Valid amount is required");
  }

  if (!data.type || !["income", "expense"].includes(data.type)) {
    errors.push("Valid type (income/expense) is required");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Description is required");
  }

  return errors;
};

const validateUser = (data) => {
  const errors = [];

  if (!data.email || !data.email.includes("@")) {
    errors.push("Valid email is required");
  }

  if (!data.username || data.username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (!data.password || data.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  return errors;
};

const validateThreshold = (threshold) => {
  const errors = [];

  if (
    threshold !== null &&
    (isNaN(parseFloat(threshold)) || parseFloat(threshold) < 0)
  ) {
    errors.push("Threshold must be a positive number or null");
  }

  return errors;
};

const validateGoal = (data) => {
  const errors = [];

  if (!data.amount || isNaN(parseFloat(data.amount))) {
    errors.push("Valid amount is required");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Description is required");
  }

  if (!data.targetDate) {
    errors.push("Target date is required");
  }

  // Return object with validation result
  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  formatDate,
  calculateBalance,
  validateTransaction,
  validateUser,
  validateThreshold,
  validateGoal,
};
