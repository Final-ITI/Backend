// HTTP Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Default Messages
export const MESSAGES = {
  SUCCESS: 'Success',
  ERROR: 'Internal Server Error',
  VALIDATION_ERROR: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  PAGINATED: 'Data retrieved successfully'
};

/**
 * Core response builder
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 */
export const buildResponse = (res, { statusCode, success, message, data = null, errors = null, pagination = null }) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) response.data = data;
  if (errors !== null) response.errors = errors;
  if (pagination !== null) response.pagination = pagination;

  // Only include error details in development
  if (!success && process.env.NODE_ENV === 'development' && data?.stack) {
    response.errorDetails = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response
 */
export const success = (res, data = null, message = MESSAGES.SUCCESS, statusCode = STATUS_CODES.OK) => 
  buildResponse(res, { statusCode, success: true, message, data });

/**
 * Created response
 */
export const created = (res, data = null, message = 'Resource created successfully') => 
  buildResponse(res, { statusCode: STATUS_CODES.CREATED, success: true, message, data });

/**
 * Error response
 */
export const error = (res, message = MESSAGES.ERROR, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, errorData = null) => 
  buildResponse(res, { statusCode, success: false, message, data: errorData });

/**
 * Validation error response
 */
export const validationError = (res, errors, message = MESSAGES.VALIDATION_ERROR) => 
  buildResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message, errors });

/**
 * Not found response
 */
export const notFound = (res, message = MESSAGES.NOT_FOUND) => 
  buildResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message });

/**
 * Unauthorized response
 */
export const unauthorized = (res, message = MESSAGES.UNAUTHORIZED) => 
  buildResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message });

/**
 * Forbidden response
 */
export const forbidden = (res, message = MESSAGES.FORBIDDEN) => 
  buildResponse(res, { statusCode: STATUS_CODES.FORBIDDEN, success: false, message });

/**
 * Paginated response
 */
export const paginated = (res, data, paginationInfo, message = MESSAGES.PAGINATED) => {
  const pagination = {
    currentPage: paginationInfo.currentPage || 1,
    totalPages: paginationInfo.totalPages || 1,
    totalItems: paginationInfo.totalItems || data.length,
    itemsPerPage: paginationInfo.itemsPerPage || data.length,
    hasNext: paginationInfo.hasNext || false,
    hasPrev: paginationInfo.hasPrev || false
  };

  return buildResponse(res, { 
    statusCode: STATUS_CODES.OK, 
    success: true, 
    message, 
    data, 
    pagination 
  });
};

/**
 * Custom response
 */
export const custom = (res, statusCode, success, message, data = null) => 
  buildResponse(res, { statusCode, success, message, data });




// Examples
/*
* Traditional Approach:
const { success, error, notFound } = require('./utils/sendResponse');

app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return notFound(res, 'User not found');
    return success(res, user, 'User retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to fetch user', 500, err);
  }
});

* Using Constants:
const { success, STATUS_CODES, MESSAGES } = require('./utils/sendResponse');

return success(res, data, MESSAGES.SUCCESS, STATUS_CODES.CREATED);

*/