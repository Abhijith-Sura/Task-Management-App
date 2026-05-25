/**
 * @desc    Custom Application Error with HTTP status code support.
 *          Thrown from service/controller layer; caught by errorMiddleware.
 */
class AppError extends Error {
  /**
   * Creates an instance of AppError.
   *
   * @param {string} message - The error message to display.
   * @param {number} [statusCode=500] - The HTTP status code associated with the error.
   */
  constructor(message, statusCode = 500) {
    super(message);
    // Attach HTTP status code to the error instance for the response handler
    this.statusCode = statusCode;
    // Set the error name explicitly to identify custom app errors
    this.name = "AppError";
    // Capture the stack trace, omitting the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
