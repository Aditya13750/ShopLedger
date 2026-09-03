# ShopLedger — Smart Customer, Billing & Payment Management System

> **A modern, full-stack billing, customer ledger, and automated WhatsApp reminder platform designed for shops, retail stores, and service businesses.**

---

## 🌟 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Local Development & Quickstart](#local-development--quickstart)
6. [Environment Variables](#environment-variables)
7. [Database Setup (MongoDB)](#database-setup-mongodb)
8. [Cloudinary Setup (Bill Image Storage)](#cloudinary-setup-bill-image-storage)
9. [Official Meta WhatsApp Cloud API Setup](#official-meta-whatsapp-cloud-api-setup)
10. [Webhook Configuration](#webhook-configuration)
11. [Automated Scheduled Reminders](#automated-scheduled-reminders)
12. [API Documentation](#api-documentation)
13. [Production Deployment Guide](#production-deployment-guide)
14. [Docker Deployment](#docker-deployment)

---

## 📖 Project Overview

**ShopLedger** replaces outdated paper ledgers ("khata book") and fragile desktop invoicing software with a high-performance web platform. It connects shop owners with their customers through instant invoice sharing and automated, policy-compliant payment reminders via the **Official Meta WhatsApp Cloud API**.

Whether tracking unpaid balances, receiving partial payments, or printing invoices for walk-in customers, ShopLedger keeps every calculation mathematically verified and backed by an auditable ledger.

---

## 🚀 Key Features

### 👤 Customer Account Management
- **Customer Directory**: Search by name, phone, or customer ID (`CUST-1001`).
- **Due Tracking**: Instant visibility into total billed, total paid, and net due amounts.
- **Account Ledger**: Complete chronological transaction ledger with dynamic running balances.
- **Dues Filter**: Filter customers with outstanding balances or view fully settled accounts.

### 🧾 Invoicing & Billing
- **Dynamic Bill Builder**: Add line items (name, quantity, unit price) with auto-calculated subtotal.
- **Taxes & Discounts**: Configurable discount deductions and tax/GST additions.
- **Automated Sequencing**: Unique bill numbers (`BILL-2026-0001`) generated automatically.
- **Receipt Image Upload**: Secure upload of receipts or photos to **Cloudinary** (JPG, PNG, PDF supported) with local preview and fallback.
- **Printable Invoices**: Clean, printable A4/thermal-friendly invoice layout.
- **Atomic Balance Updates**: Creating or updating bills instantly recalculates customer totals without state drift.

### 💳 Payment Management & Ledger
- **Multiple Payment Modes**: Record payments via UPI, Cash, Bank Transfer, Card, or Custom methods.
- **Bill Allocation**: Link payments directly to unpaid bills or credit general customer accounts.
- **Atomic Balances**: Automatically marks bills `PAID`, `PARTIALLY_PAID`, or `UNPAID`.
- **Payment Reversals**: Deleting a payment record safely restores bill dues and customer balances.

### 💬 Official Meta WhatsApp Cloud API Integration
- **Direct Bill Dispatch**: Send formatted bill notifications with a single click.
- **Attached Media**: Attaches invoice documents or images directly via Meta's Graph API.
- **Message Audit History**: Full audit trail recording message content, timestamps, Meta Message IDs, and status (`PENDING`, `SENT`, `DELIVERED`, `READ`, `FAILED`).
- **Webhook Status Sync**: Public webhook receiver for real-time delivery and read receipt callbacks from Meta.
- **Sandbox Fallback Mode**: Graceful dev/sandbox mode enables complete testing even before live Meta credentials are provided.

### ⏰ Automated Scheduled Payment Reminders
- **Background Cron Engine**: Hourly schedule evaluation via `node-cron`.
- **Anti-Spam Deduplication**: Ensures customers only receive reminders according to the configured frequency (`DAILY`, `EVERY_3_DAYS`, `WEEKLY`, `MONTHLY`, or `CUSTOM` days).
- **Threshold Setting**: Configurable minimum due amount (e.g., skip balances under ₹100).
- **Manual Trigger**: Shop owners can trigger the reminder cycle on demand or dispatch single-customer reminders.

### 📊 Financial Dashboard & Analytics
- **KPI Metrics**: Total Customers, Total Invoiced, Payments Collected, Outstanding Dues, Today's Sales, and This Month's Sales.
- **Interactive Recharts**: Monthly sales revenue vs. collections area chart.
- **High-Risk Debtor Watch**: Top customers with highest pending dues and their last contact date.
- **Recent Invoices**: Quick preview and WhatsApp actions for latest bills.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6, Axios, React Hook Form, Zod |
| **Backend** | Node.js, Express.js, TypeScript, Mongoose / MongoDB, JWT, bcryptjs, Multer, Cloudinary SDK, node-cron, Axios |
| **Database** | MongoDB (Local or MongoDB Atlas) |
| **Cloud Storage** | Cloudinary |
| **Messaging** | Official Meta WhatsApp Business Platform (Cloud API v20.0) |
| **DevOps** | Docker, Docker Compose, Nginx, Render, Railway, Vercel |

---

## 📂 Project Structure

```
ShopLedger/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts         # MongoDB Mongoose connection
│   │   │   ├── cloudinary.ts       # Cloudinary SDK config
│   │   │   └── whatsapp.ts         # Meta Cloud API settings
│   │   ├── controllers/            # Auth, Customer, Bill, Payment, Reminder, WhatsApp, Dashboard
│   │   ├── middleware/             # JWT auth, Zod validation, Multer upload, error handling
│   │   ├── models/                 # User, Customer, Bill, Payment, Reminder, WhatsAppMessage, ShopSettings
│   │   ├── services/               # Business logic, ledger calculation, Meta API dispatch, cron runner
│   │   ├── jobs/                   # node-cron scheduled reminder runner
│   │   ├── routes/                 # Express API routing
│   │   ├── utils/                  # ID generators, API response envelopes
│   │   ├── app.ts                  # Express app definition, CORS, Helmet, rate-limiting
│   │   ├── server.ts               # Server entrypoint
│   │   └── testRunner.ts           # Math & logic test suite
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Button, Input, Modal, Badge, Card, StatCard, ConfirmDialog
│   │   │   ├── layout/             # Sidebar, Header, Layout, ProtectedRoute
│   │   │   ├── customers/          # CustomerModal
│   │   │   ├── bills/              # BillFormModal, BillViewModal, BillPrintModal
│   │   │   └── payments/           # PaymentModal
│   │   ├── context/                # AuthContext, ToastContext
│   │   ├── pages/
│   │   │   ├── auth/               # Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── dashboard/          # Dashboard analytics & charts
│   │   │   ├── customers/          # Directory & CustomerLedger
│   │   │   ├── bills/              # Bills management
│   │   │   ├── payments/           # Collections log
│   │   │   ├── reminders/          # Reminder rules & logs
│   │   │   ├── whatsapp/           # WhatsApp delivery feed
│   │   │   └── settings/           # Business settings & webhook info
│   │   ├── services/               # Axios API clients
│   │   ├── types/                  # Shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml              # Multi-container orchestration
└── README.md
```

---

## ⚡ Local Development & Quickstart

### Prerequisites
- Node.js **v18+** (v20+ recommended)
- MongoDB running locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- npm or yarn

### 1. Clone & Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` with your preferred settings:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/shopledger
JWT_SECRET=your_jwt_secret_key_here
```

Start the backend in development mode:
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

### 2. Setup Frontend
In another terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/shopledger` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secret_key_minimum_32_chars` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `demo` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_secret` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Phone Number ID | `105948372615` |
| `WHATSAPP_ACCESS_TOKEN` | Meta System User / Permanent Token | `EAAB...` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta WABA ID | `987654321` |
| `WHATSAPP_VERIFY_TOKEN` | Secret token for webhook handshake | `shopledger_webhook_verify_token_2026` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `/api` (local) or `https://backend.onrender.com/api` (prod) |

---

## 🗄 Database Setup (MongoDB)

1. **Local MongoDB**: Ensure `mongod` service is running on your machine.
2. **MongoDB Atlas (Cloud)**:
   - Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
   - Under **Database Access**, create a user with read/write permissions.
   - Under **Network Access**, add `0.0.0.0/0` (allow from anywhere).
   - Copy the SRV URI (e.g., `mongodb+srv://admin:<password>@cluster.mongodb.net/shopledger?retryWrites=true&w=majority`) into `MONGODB_URI`.

---

## ☁️ Cloudinary Setup (Bill Image Storage)

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com).
2. Go to the **Dashboard** and copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Paste these values into `backend/.env`.
4. If omitted, ShopLedger automatically uses a secure base64 data URI fallback mode so receipt previews continue working in local dev without configuration.

---

## 📲 Official Meta WhatsApp Cloud API Setup

ShopLedger uses the **official Meta Graph API** (`https://graph.facebook.com/v20.0/`):

1. Go to [developers.facebook.com](https://developers.facebook.com/) and register as a Meta Developer.
2. Create an App → Select **Business** as the app type.
3. In the App Dashboard, add **WhatsApp** to your application.
4. Navigate to **WhatsApp → API Setup**:
   - You will see a **Temporary Access Token** and **Phone Number ID**.
   - Copy `Phone Number ID` into `WHATSAPP_PHONE_NUMBER_ID`.
   - Copy `Temporary Access Token` (or create a permanent System User Token under Business Manager) into `WHATSAPP_ACCESS_TOKEN`.
5. Add your recipient phone number to the Test Recipients list in Meta Developer Portal.

---

## 🔗 Webhook Configuration

To receive delivery receipts (`SENT`, `DELIVERED`, `READ`, `FAILED`):

1. In Meta Developer Portal, go to **WhatsApp → Configuration → Webhook**.
2. Click **Edit**:
   - **Callback URL**: `https://<YOUR_BACKEND_DOMAIN>/api/whatsapp/webhook`
   - **Verify Token**: `shopledger_webhook_verify_token_2026` (or the value set in `WHATSAPP_VERIFY_TOKEN`).
3. Click **Verify and Save**.
4. In Webhook fields, click **Subscribe** to `messages`.

---

## 📡 API Documentation

### Authentication
- `POST /api/auth/register` — Create initial admin user
- `POST /api/auth/login` — Sign in and get JWT token
- `POST /api/auth/forgot-password` — Generate password reset token
- `POST /api/auth/reset-password` — Set new password using token
- `GET /api/auth/me` — Get current user profile *(Bearer Auth)*

### Customers
- `GET /api/customers` — List customers with search, due filters, and pagination
- `POST /api/customers` — Create a new customer
- `GET /api/customers/:id` — Get customer profile
- `PUT /api/customers/:id` — Update customer details
- `DELETE /api/customers/:id` — Delete customer and cascade
- `GET /api/customers/:id/ledger` — Generate chronological account ledger with running balances
- `POST /api/customers/:id/recalculate` — Force recalculation of customer balances

### Bills
- `GET /api/bills` — Filter bills by status, date, and customer
- `POST /api/bills` — Create bill with dynamic items, taxes, discounts, and auto customer balance update
- `GET /api/bills/:id` — Get bill details
- `PUT /api/bills/:id` — Update bill line items and amounts
- `DELETE /api/bills/:id` — Delete bill and restore customer balances
- `POST /api/bills/:id/upload` — Upload receipt image (Multer + Cloudinary)
- `POST /api/bills/:id/send-whatsapp` — Send bill notification via Meta WhatsApp API

### Payments
- `GET /api/payments` — List payment collections
- `POST /api/payments` — Record payment, update bill status, credit customer ledger
- `GET /api/payments/:id` — Get payment record
- `DELETE /api/payments/:id` — Reverse payment and restore dues

### Reminders
- `GET /api/reminders` — Get reminder logs
- `POST /api/reminders/send` — Send manual WhatsApp reminder to specific customer
- `POST /api/reminders/trigger-auto` — Execute the scheduled reminder cycle immediately

### WhatsApp
- `GET /api/whatsapp/history` — Audit log of all sent WhatsApp messages
- `GET /api/whatsapp/webhook` — Meta webhook verification handshake
- `POST /api/whatsapp/webhook` — Meta webhook status delivery callbacks

### Dashboard & Settings
- `GET /api/dashboard/summary` — Overview KPIs, top debtors, recent bills
- `GET /api/dashboard/analytics` — Monthly trends for Recharts
- `GET /api/settings` — Get shop preferences and integration status
- `PUT /api/settings` — Update shop info and reminder frequency

---

## 🚀 Production Deployment Guide

### Recommended Stack
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com) or [Railway](https://railway.app)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Images**: [Cloudinary](https://cloudinary.com)

### 1. Deploying Backend to Render
1. Push repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New Web Service**.
3. Connect your repository.
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<A strong random 64-character secret>`
   - `FRONTEND_URL`: `https://your-app.vercel.app`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`
6. Click **Deploy**. Note the backend URL: `https://shopledger-api.onrender.com`.

### 2. Deploying Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) → **Add New Project**.
2. Select your repository.
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://shopledger-api.onrender.com/api`
5. Click **Deploy**.

---

## 🐳 Docker Deployment

To spin up the complete application including a local MongoDB database in containers:

```bash
docker-compose up --build -d
```
- **Frontend**: Available at `http://localhost:3000`
- **Backend API**: Available at `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`
- **MongoDB**: Listening on port `27017`

---

## 🛡 Security & Best Practices
- Passwords securely hashed with **bcryptjs** (10 salt rounds).
- **JWT tokens** with expiration for all protected endpoints.
- **Helmet** configured for HTTP security headers.
- **Rate limiting** on API routes to mitigate brute force attempts.
- Server-side **Zod** request validation for inputs.
- Safe **atomic balance updates** to prevent corrupted customer ledgers.
- Zero secrets committed to source control.

---

## 📄 License
This project is licensed under the MIT License.
