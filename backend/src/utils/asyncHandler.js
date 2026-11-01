/**
 * asyncHandler — Wraps async route handlers to catch errors automatically
 *
 * Without this, every async controller would need its own try/catch block.
 * This wrapper catches any rejected promise and forwards the error to
 * Express's global error handler via next(err).
 *
 * Usage:
 *   router.get('/items', asyncHandler(async (req, res) => {
 *     const items = await service.getAll();
 *     ApiResponse.success(res, items);
 *   }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
