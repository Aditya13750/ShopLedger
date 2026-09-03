import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import apiRoutes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware';

const app: Express = express();

// Trust reverse proxy (required for Render, Railway, Vercel, etc.)
// This allows express-rate-limit to correctly identify client IPs
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  // Render backend self-origin
  'https://shopledger-bmhy.onrender.com',
  // Allow all Vercel preview deployments for the frontend
  /\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, or server-to-server)
      if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiter: 300 requests per 15 minutes per IP (generous for dashboard polling)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Request body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint for deployment platforms (Render, Railway, etc.)
app.get('/health', (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.status(200).json({
    status: 'UP',
    service: 'ShopLedger API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: states[mongoStatus] || 'Unknown',
  });
});

// Root welcome endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'ShopLedger Backend API',
    version: '1.0.0',
    documentation: '/api',
    health: '/health',
  });
});

// Mount all API routes
app.use('/api', apiRoutes);

// Catch-all 404
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
