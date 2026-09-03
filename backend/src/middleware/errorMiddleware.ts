import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import multer from 'multer';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File size exceeds 10MB limit', 400);
      return;
    }
    sendError(res, `Upload error: ${err.message}`, 400);
    return;
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, 'Database validation failed', 400, errors);
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    sendError(res, `Duplicate entry: A record with this ${field} already exists`, 409);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? [err.stack] : []);
};
