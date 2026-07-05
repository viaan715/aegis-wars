// Express 4 doesn't catch rejected promises from async route handlers — an
// unhandled rejection there would hang the request instead of reaching the
// error middleware. Wrapping every handler routes the rejection to next(err).
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
