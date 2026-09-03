import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

const signToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'shopledger_dev_secret_key_834f4871b0ab4992a0b23950a831b7e3';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
  return jwt.sign({ id, role }, secret, { expiresIn });
};

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        sendError(res, 'Name, email, and password are required', 400);
        return;
      }

      if (password.length < 6) {
        sendError(res, 'Password must be at least 6 characters long', 400);
        return;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        sendError(res, 'An account with this email already exists', 409);
        return;
      }

      const totalUsers = await User.countDocuments();
      const role = totalUsers === 0 ? 'admin' : 'staff';

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
      });

      await user.save();

      const token = signToken(user._id.toString(), user.role);

      sendSuccess(
        res,
        'Account registered successfully',
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
        201
      );
    } catch (error: any) {
      sendError(res, error.message || 'Registration failed', 500);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        sendError(res, 'Email and password are required', 400);
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        sendError(res, 'Invalid email or password', 401);
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        sendError(res, 'Invalid email or password', 401);
        return;
      }

      const token = signToken(user._id.toString(), user.role);

      sendSuccess(res, 'Logged in successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Login failed', 500);
    }
  }

  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      sendSuccess(res, 'User profile fetched', {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch user', 500);
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, 'Email is required', 400);
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Return 200 for security so attackers cannot enumerate registered emails
        sendSuccess(res, 'If an account exists with this email, a password reset token has been issued.');
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Return token in dev mode or response for quick verification
      sendSuccess(res, 'Password reset token generated', {
        resetToken,
        instructions: 'Use this reset token on the reset-password page.',
      });
    } catch (error: any) {
      sendError(res, error.message || 'Forgot password request failed', 500);
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        sendError(res, 'Token and new password are required', 400);
        return;
      }

      if (newPassword.length < 6) {
        sendError(res, 'Password must be at least 6 characters', 400);
        return;
      }

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        sendError(res, 'Invalid or expired password reset token', 400);
        return;
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      sendSuccess(res, 'Password has been reset successfully. You can now login.');
    } catch (error: any) {
      sendError(res, error.message || 'Reset password failed', 500);
    }
  }
}
