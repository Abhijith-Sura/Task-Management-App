/**
 * @desc    Standardized API Response format
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  /**
   * @desc    Send the response using an Express res object
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}

/**
 * @desc    Helper for success responses
 */
export const successResponse = (res, data, message, statusCode = 200) => {
  return new ApiResponse(statusCode, data, message).send(res);
};

/**
 * @desc    Helper for error responses
 */
export const errorResponse = (res, message, statusCode = 500) => {
  return new ApiResponse(statusCode, null, message).send(res);
};

export default ApiResponse;
