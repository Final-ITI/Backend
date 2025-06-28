import { validationResult, matchedData } from "express-validator";
import ApiError from "../utils/apiError.js";
import { Types } from "mongoose";


// Middleware to handle validation result
export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map(err => err.msg);
      return next(new ApiError(extractedErrors, 400));
    }

    // Use only sanitized data
    req.filtered = matchedData(req, { locations: ["body", "params", "query"] });

    next();
  };
};

// Middleware to validate ObjectId
export const isValidObjectId = (value) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error("Invalid Object ID");
  }
  return true;
};