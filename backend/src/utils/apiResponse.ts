import { Response } from 'express';

export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: Record<string, any>;
}

export const sendSuccess = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: Record<string, any>
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data !== undefined ? data : null,
    ...(meta ? { meta } : {}),
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors: any[] = []
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
