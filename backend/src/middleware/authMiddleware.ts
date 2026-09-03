import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { sendError } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication token missing or invalid', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'shopledger_dev_secret_key_834f4871b0ab4992a0b23950a831b7e3';

    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      sendError(res, 'User no longer exists or session expired', 401);
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    sendError(res, 'Invalid or expired token', 401, [error.message]);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to perform this action', 403);
      return;
    }
    next();
  };
};
