import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 does not catch a rejected promise from an async route handler —
 * it hangs the request instead of erroring. Wrapping every handler here
 * forwards a rejection to Express's own error middleware.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
