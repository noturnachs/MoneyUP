const { validateTransaction, validateUser } = require("../utils/helpers");

exports.validateTransactionMiddleware = (req, res, next) => {
  const errors = validateTransaction(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

exports.validateUserMiddleware = (req, res, next) => {
  const errors = validateUser(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};
