/**
 * @desc    Wrapper to handle async errors in Express routes
 * @param   {Function} fn - The async function to wrap (typically a route controller)
 * @returns {Function} - Express middleware function that catches promises rejections
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Execute the async route handler and pass any caught exceptions to the next middleware (error handler)
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
