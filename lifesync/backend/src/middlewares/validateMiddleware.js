import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().forEach((err) => {
    extractedErrors.push({ field: err.path || err.param, message: err.msg });
  });

  throw new ApiError(422, "Validation failed", extractedErrors);
};

export { validate };
