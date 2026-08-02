# 🕹️ Dreamland Arcade Management System

A full-stack arcade management platform built with **Python FastAPI**, **PostgreSQL**, and **vanilla HTML5/CSS/JS**. Features a futuristic neon arcade theme with role-based access control (Owner/Admin/Employee) and strict branch-level data isolation via PostgreSQL Row-Level Security.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Security](#security)
- [Getting Started](#getting-start)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Roles & Permissions](#roles--permissions)
- [Deployment](#deployment)

---

## 🎯 Overview

Dreamland Arcade Management System is designed to manage two arcade branches:

- **Dreamland Arcade - Main** (Siniloan, Laguna)
- **Dreamland Arcade - Infanta** (Infanta, Quezon)

The system handles employee management, attendance tracking, scheduling, inventory, POS operations, financial reporting, loyalty programs, proposals, and internal communications — all with branch-level data isolation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy ORM, Pydantic |
| **Database** | PostgreSQL 17 with Row-Level Security (RLS) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6) |
| **Auth** | JWT tokens + PIN-based authentication (passlib bcrypt) |
| **Email** | Gmail SMTP (send) + IMAP (polling) |
| **Charts** | Chart.js 4.4.7 |
| **Styling** | Custom CSS with neon arcade theme (Orbitron font) |

---

## ✨ Features

### Owner Dashboard
- Real-time overview of both branches
- Revenue analytics and comparison charts
- Proposal review and approval system
- Recycle bin management (restore/permanent delete)
- Email client (Gmail integration)

### Admin Panel (Branch-Scoped)
- Employee management (CRUD, PIN assignment)
- Attendance tracking with clock-in/out
- Schedule management with auto-reshuffle algorithm
- Day-off request review and approval
- Holiday and special event management
- Inventory tracking and stock management
- POS report submission with cash denomination counting
- Tracking sheet management (Arcade/Playhouse/Cafe areas)
- Payslip generation and approval
- Announcement creation and broadcasting
- Proposal creation and submission to owner
- Internal messaging system
- Loyalty card management with tier progression

### POS Terminal
- Product grid with category filtering
- Cart management and sale completion
- Token-based transactions (Smash tokens, Extra tokens)
- Receipt generation
- Loyalty card scanning and points earning
- Part-time employee access restriction

### Employee Portal
- Personal attendance history
- Schedule viewing
- Day-off request submission
- Payslip viewing
- Announcement viewing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                    Frontend                      │
│  Vanilla HTML5/CSS/JS with neon arcade theme    │
│  Hash-based SPA routing (no framework)          │
│  42 JS files, 7 CSS files                       │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/REST API
┌──────────────────▼──────────────────────────────┐
│                  Backend                        │
│  FastAPI with 22+ route modules                 │
│  Service layer for business logic               │
│  Middleware: Security, Rate Limit, Auth Throttle │
└──────────────────┬──────────────────────────────┘
                   │ SQLAlchemy ORM
┌──────────────────▼──────────────────────────────┐
│               PostgreSQL 17                     │
│  28 tables with RLS policies                    │
│  27 performance indexes on FK columns           │
│  Row-Level Security for branch isolation        │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables (28 total)

| Table | Purpose | RLS |
|-------|---------|-----|
| `branches` | Branch locations (2 branches) | Global |
| `users` | Employees, admins, owner | ✅ |
| `members` | Loyalty card holders | ✅ |
| `attendance` | Clock-in/out records | ✅ |
| `schedules` | Employee work schedules | ✅ |
| `dayoff_requests` | Day-off applications | ✅ |
| `holidays` | Holiday calendar | ✅ |
| `special_events` | Special events tracking | ✅ |
| `products` | POS products | ✅ |
| `sales` | POS transactions | ✅ |
| `sale_items` | Individual sale line items | Via parent |
| `tracking_sheets` | Daily cash flow sheets | ✅ |
| `tracking_sheet_items` | Sheet line items | Via parent |
| `pos_reports` | Daily POS summaries | ✅ |
| `payslips` | Employee payslips | ✅ |
| `announcements` | Internal announcements | ✅ |
| `proposals` | Monthly proposals | ✅ |
| `notifications` | User notifications | ✅ |
| `message_threads` | Message conversations | ✅ |
| `messages` | Individual messages | Via thread |
| `message_participants` | Thread members | Via thread |
| `emails` | Email records | ✅ |
| `inventory_categories` | Inventory categories | Global |
| `inventory_items` | Inventory stock | ✅ |
| `inventory_logs` | Stock movement logs | ✅ |
| `member_transactions` | Loyalty point transactions | ✅ |
| `recycle_bin` | Soft-deleted records | ✅ |

### Row-Level Security

All branch-scoped tables enforce data isolation via PostgreSQL RLS policies:

```sql
-- Owner sees all branches, employees see only their branch
USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
);
```

Session variables are set per-request via `get_current_user()` in `dependencies.py`.

---

## 🔒 Security

### Authentication
- **PIN-based auth** with 4-6 digit PINs
- **passlib bcrypt** hashing (not raw bcrypt module)
- **JWT tokens** with 8-hour access + 7-day refresh
- **Login throttle**: 5 failed attempts → 5-minute lockout per IP

### Middleware Stack
1. `SecureErrorsMiddleware` — Hides internal error details
2. `RequestLoggingMiddleware` — Logs all requests to `security.log`
3. `SecurityHeadersMiddleware` — Adds X-Frame-Options, CSP, etc.
4. `LoginThrottleMiddleware` — Per-IP rate limiting for auth
5. `RateLimitMiddleware` — 120 requests/minute per IP
6. `CORSMiddleware` — Configurable allowed origins

### Data Isolation
- **Row-Level Security (RLS)** on 20+ tables
- **Branch-scoped queries** enforced at database level
- **Admin role** restricted to own branch
- **Employee role** restricted to own data

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL 17
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/rjvtayam/dreamland_arcade_project.git
cd dreamland_arcade_project

# Install dependencies
pip install -r backend/requirements.txt

# Create the database
psql -U postgres -c "CREATE DATABASE dreamland_arcade;"

# Create the app user (recommended over using postgres superuser)
psql -U postgres -d dreamland_arcade -c "
CREATE USER dreamland_app WITH PASSWORD 'dl_app_2026';
GRANT ALL PRIVILEGES ON SCHEMA public TO dreamland_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dreamland_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dreamland_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dreamland_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dreamland_app;
"

# Apply RLS policies
psql -U postgres -d dreamland_arcade -f backend/migrations/rls_migration.sql
psql -U postgres -d dreamland_arcade -f backend/migrations/performance_indexes.sql

# Start the server
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Access

- **Web Interface**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs (debug mode only)

### Default Credentials

| Role | PIN | Access |
|------|-----|--------|
| Owner | `1234` | All branches |
| Admin | `1001` | Own branch only |

---

## 📡 API Documentation

### Core Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login with PIN | Public |
| POST | `/api/auth/refresh` | Refresh JWT token | Public |
| GET | `/api/auth/me` | Get current user | Bearer |
| GET | `/api/branches` | List branches | Public |
| GET | `/api/users` | List employees | Owner/Admin |
| POST | `/api/users` | Create employee | Owner/Admin |
| GET | `/api/attendance` | List attendance | Owner/Admin |
| POST | `/api/attendance/clock-in` | Clock in | Bearer |
| POST | `/api/attendance/clock-out` | Clock out | Bearer |
| GET | `/api/schedules` | List schedules | Owner/Admin |
| POST | `/api/schedules/reshuffle` | Auto-reshuffle | Owner/Admin |
| GET | `/api/members` | List loyalty members | Owner/Admin |
| POST | `/api/members` | Issue loyalty card | Owner/Admin |
| GET | `/api/products` | List POS products | Owner/Admin |
| POST | `/api/sales` | Create sale | Bearer |
| GET | `/api/tracking-sheets` | List tracking sheets | Owner/Admin |
| GET | `/api/proposals` | List proposals | Owner/Admin |
| POST | `/api/proposals` | Create proposal | Owner/Admin |
| GET | `/api/notifications` | List notifications | Bearer |
| GET | `/api/messages/threads` | List message threads | Bearer |
| GET | `/api/emails` | List emails | Owner/Admin |

### Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## 📁 Project Structure

```
dreamland_arcade_project/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── database.py             # SQLAlchemy engine + session
│   ├── config.py               # Settings via pydantic-settings
│   ├── dependencies.py         # Auth + RLS session vars
│   ├── middleware.py           # Security middleware stack
│   ├── models/                 # SQLAlchemy ORM models (18 files)
│   │   ├── user.py
│   │   ├── branch.py
│   │   ├── member.py
│   │   ├── attendance.py
│   │   ├── schedule.py
│   │   ├── sale.py
│   │   ├── product.py
│   │   ├── tracking_sheet.py
│   │   ├── proposal.py
│   │   └── ...
│   ├── schemas/                # Pydantic request/response (16 files)
│   ├── routers/                # API route handlers (22 files)
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── attendance.py
│   │   ├── schedules.py
│   │   ├── members.py
│   │   ├── sales.py
│   │   ├── proposals.py
│   │   └── ...
│   ├── services/               # Business logic (8 files)
│   │   ├── auth_service.py
│   │   ├── attendance_service.py
│   │   ├── email_service.py
│   │   ├── pos_service.py
│   │   └── ...
│   ├── migrations/
│   │   ├── rls_migration.sql
│   │   └── performance_indexes.sql
│   ├── requirements.txt
│   └── .env                    # Environment variables (gitignored)
├── frontend/
│   ├── index.html              # Single-page app shell
│   ├── css/
│   │   ├── main.css
│   │   ├── components.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── notifications.css
│   │   ├── confirm-dialog.css
│   │   └── landing.css
│   ├── js/
│   │   ├── config.js           # App configuration
│   │   ├── auth.js             # Token management
│   │   ├── api.js              # HTTP client + auto-refresh
│   │   ├── utils.js            # Shared utilities (esc, formatDate, etc.)
│   │   ├── router.js           # Hash-based SPA router
│   │   ├── components/
│   │   │   ├── sidebar.js
│   │   │   ├── navbar.js
│   │   │   ├── toast.js
│   │   │   ├── modal.js
│   │   │   ├── confirm-dialog.js
│   │   │   └── notifications.js
│   │   └── pages/              # Page renderers (20+ files)
│   │       ├── admin-dashboard.js
│   │       ├── admin-users.js
│   │       ├── admin-attendance.js
│   │       ├── admin-schedules.js
│   │       ├── admin-tracking.js
│   │       ├── admin-pos.js
│   │       ├── admin-loyalty.js
│   │       ├── admin-proposals.js
│   │       ├── pos-terminal.js
│   │       └── ...
│   └── assets/
│       └── favicon.ico
└── .gitignore
```

---

## 👥 Roles & Permissions

| Feature | Owner | Admin | Employee |
|---------|-------|-------|----------|
| View all branches | ✅ | ❌ | ❌ |
| Manage employees | ✅ | ✅ (own branch) | ❌ |
| Approve proposals | ✅ | ❌ | ❌ |
| Create proposals | ✅ | ✅ | ❌ |
| View own schedule | ✅ | ✅ | ✅ |
| Submit day-off request | ✅ | ✅ | ✅ |
| Clock in/out | ✅ | ✅ | ✅ |
| POS terminal | ✅ | ✅ | ✅ (full-time only) |
| View payslips | ✅ | ✅ (own branch) | ✅ (own) |
| Manage inventory | ✅ | ✅ (own branch) | ❌ |
| Recycle bin | ✅ | ✅ (own branch) | ❌ |
| Email client | ✅ | ✅ | ❌ |

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Generate strong `JWT_SECRET_KEY`
- [ ] Set `CORS_ORIGINS` to production domain
- [ ] Configure Gmail App Password for SMTP/IMAP
- [ ] Use `dreamland_app` user (not `postgres` superuser)
- [ ] Enable HTTPS (reverse proxy with nginx/caddy)
- [ ] Set up database backups
- [ ] Configure log rotation (already implemented in code)

### Environment Variables

```env
DATABASE_URL=postgresql://dreamland_app:dl_app_2026@localhost:5432/dreamland_arcade
JWT_SECRET_KEY=your-strong-secret-key-here
DEBUG=False
CORS_ORIGINS=https://yourdomain.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dreamlandarcade2026@gmail.com
SMTP_PASSWORD=your-app-password

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=dreamlandarcade2026@gmail.com
IMAP_PASSWORD=your-app-password
```

---

## 📊 Performance

- **Connection pooling**: Pool size 20, overflow 30, pre-ping enabled
- **27 database indexes** on foreign key columns
- **120 req/min** rate limit per IP
- **Login throttle**: 5 attempts per IP before 5-min lockout
- **Log rotation**: 5MB max, 3 backups

---

## 📝 License

Private — Dreamland Arcade Internal Use Only

---

## 👨‍💻 Author

**RJ Verdan Tayam** — Admin, Dreamland Arcade - Infanta Branch

Built with ❤️ for Dreamland Arcade operations management.
