/**
 * @desc    Standardized API Response format
 */
class ApiResponse {
  /**
   * Initializes a new ApiResponse instance.
   *
   * @param {number} statusCode - The HTTP status code of the response.
   * @param {any} data - The payload to be sent in the response body.
   * @param {string} [message="Success"] - A brief message describing the result.
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // Automatically determine success status based on HTTP code range (2xx and 3xx are successful)
    this.success = statusCode < 400;
  }

  /**
   * @desc    Send the response using an Express res object
   * @param   {import('express').Response} res - Express response object
   * @returns {import('express').Response} The Express response populated with JSON data
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
 * @param   {import('express').Response} res - Express response object
 * @param   {any} data - Response payload
 * @param   {string} message - Success message
 * @param   {number} [statusCode=200] - HTTP status code
 * @returns {import('express').Response} Express response
 */
export const successResponse = (res, data, message, statusCode = 200) => {
  return new ApiResponse(statusCode, data, message).send(res);
};

/**
 * @desc    Helper for error responses
 * @param   {import('express').Response} res - Express response object
 * @param   {string} message - Error description
 * @param   {number} [statusCode=500] - HTTP status code
 * @returns {import('express').Response} Express response
 */
export const errorResponse = (res, message, statusCode = 500) => {
  return new ApiResponse(statusCode, null, message).send(res);
};

export default ApiResponse;
