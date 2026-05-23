/**
 * @desc    Custom Application Error with HTTP status code support.
 *          Thrown from service/controller layer; caught by errorMiddleware.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
