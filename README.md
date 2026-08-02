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

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Frontend (SPA)                         │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │  Router   │  │   Auth   │  │   API    │  │  Utils   │ │  │
│  │  │ (hash)   │  │ (JWT)    │  │ (fetch)  │  │ (esc,    │ │  │
│  │  │          │  │          │  │          │  │ format)  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              Page Renderers (20+ files)              │ │  │
│  │  │  dashboard, users, attendance, schedules, POS,      │ │  │
│  │  │  tracking, loyalty, proposals, email, messages...    │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              Components (7 files)                    │ │  │
│  │  │  sidebar, navbar, toast, modal, confirm-dialog,     │ │  │
│  │  │  notifications, table                                │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP/REST API
                                │ Authorization: Bearer <token>
┌───────────────────────────────▼─────────────────────────────────┐
│                        SERVER (FastAPI)                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Middleware Stack                        │  │
│  │                                                           │  │
│  │  1. SecureErrorsMiddleware    (hide internal errors)      │  │
│  │  2. CORSMiddleware            (configurable origins)      │  │
│  │  3. RequestLoggingMiddleware  (log to security.log)       │  │
│  │  4. SecurityHeadersMiddleware (X-Frame, CSP, etc.)       │  │
│  │  5. LoginThrottleMiddleware   (5 attempts → 5min lock)   │  │
│  │  6. RateLimitMiddleware       (120 req/min per IP)        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 Auth & Dependencies                       │  │
│  │                                                           │  │
│  │  • HTTPBearer → verify JWT token                          │  │
│  │  • get_current_user → fetch user + set RLS vars           │  │
│  │  • require_role("owner", "admin") → role guard            │  │
│  │  • RLS session vars: app.current_branch_id,               │  │
│  │                      app.current_user_role                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Route Handlers (22 modules)                  │  │
│  │                                                           │  │
│  │  Auth:        /auth/login, /auth/refresh, /auth/me       │  │
│  │  Users:       /users (CRUD)                               │  │
│  │  Branches:    /branches (public)                          │  │
│  │  Attendance:  /attendance, /clock-in, /clock-out          │  │
│  │  Schedules:   /schedules, /reshuffle                      │  │
│  │  Day-offs:    /dayoffs (request, approve, decline)        │  │
│  │  Holidays:    /holidays, /special-events                  │  │
│  │  Products:    /products (POS catalog)                     │  │
│  │  Sales:       /sales (transactions)                       │  │
│  │  Members:     /members (loyalty cards)                    │  │
│  │  Tracking:    /tracking-sheets (daily cash flow)          │  │
│  │  POS Reports: /pos-reports (daily summaries)              │  │
│  │  Payslips:    /payslips (generate, approve)               │  │
│  │  Inventory:   /inventory, /inventory-logs                 │  │
│  │  Announce:    /announcements (create, broadcast)          │  │
│  │  Proposals:   /proposals (submit, approve, decline)       │  │
│  │  Messages:    /messages/threads, /messages                │  │
│  │  Email:       /emails (SMTP send, IMAP poll)              │  │
│  │  Notifications: /notifications (read, unread)             │  │
│  │  Recycle Bin: /recycle-bin (restore, permanent delete)    │  │
│  │  Reports:     /reports (analytics)                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Service Layer (8 modules)                  │  │
│  │                                                           │  │
│  │  auth_service       → PIN hashing, JWT creation           │  │
│  │  attendance_service → clock-in/out logic, late detection  │  │
│  │  email_service      → SMTP send, IMAP poll, demo mode     │  │
│  │  inventory_service  → CRUD, stock management              │  │
│  │  pos_service        → Product CRUD, tracking sheet sync   │  │
│  │  schedule_service   → Schedule CRUD, reshuffle algorithm  │  │
│  │  report_service     → Revenue analytics, aggregation      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              SQLAlchemy ORM (18 models)                   │  │
│  │                                                           │  │
│  │  User, Branch, Member, Attendance, Schedule,              │  │
│  │  DayoffRequest, Holiday, SpecialEvent,                    │  │
│  │  Product, Sale, SaleItem, TrackingSheet,                  │  │
│  │  TrackingSheetItem, Payslip, Proposal,                    │  │
│  │  Notification, MessageThread, Message,                    │  │
│  │  MessageParticipant, Email, InventoryItem,                │  │
│  │  InventoryLog, InventoryCategory,                         │  │
│  │  MemberTransaction, RecycleBin, PosReport                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ SQLAlchemy ORM
                                │ Connection Pool: 20+30
                                │ pool_pre_ping=True
┌───────────────────────────────▼─────────────────────────────────┐
│                      PostgreSQL 17                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Row-Level Security (RLS)                     │  │
│  │                                                           │  │
│  │  Session vars set per-request:                            │  │
│  │    SET app.current_branch_id = <user's branch>            │  │
│  │    SET app.current_user_role = <owner|admin|employee>     │  │
│  │                                                           │  │
│  │  Policy: owner sees all, others see own branch only       │  │
│  │                                                           │  │
│  │  20 tables with RLS enabled:                              │  │
│  │  users, attendance, schedules, sales, members,            │  │
│  │  proposals, payslips, tracking_sheets, products,          │  │
│  │  inventory_items, inventory_logs, announcements,          │  │
│  │  holidays, special_events, dayoff_requests,               │  │
│  │  notifications, emails, pos_reports,                      │  │
│  │  member_transactions, recycle_bin                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Performance Indexes (27)                     │  │
│  │                                                           │  │
│  │  All foreign key columns indexed:                         │  │
│  │  • sales: (sold_by), (branch_id, created_at)              │  │
│  │  • attendance: (user_id), (branch_id),                    │  │
│  │               (user_id, clock_in)                         │  │
│  │  • schedules: (user_id), (branch_id),                     │  │
│  │               (user_id, branch_id, day_of_week)           │  │
│  │  • payslips: (user_id), (branch_id)                       │  │
│  │  • And 15+ more on dayoffs, inventory, members, etc.      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Database Tables (28)                         │  │
│  │                                                           │  │
│  │  Core:      branches, users, members                      │  │
│  │  Operations: attendance, schedules, dayoff_requests,      │  │
│  │              holidays, special_events                     │  │
│  │  Sales:     products, sales, sale_items, pos_reports      │  │
│  │  Finance:   tracking_sheets, tracking_sheet_items,        │  │
│  │             payslips                                      │  │
│  │  Loyalty:   member_transactions                           │  │
│  │  Inventory: inventory_categories, inventory_items,        │  │
│  │             inventory_logs                                │  │
│  │  Comms:     announcements, notifications,                 │  │
│  │             message_threads, messages,                    │  │
│  │             message_participants, emails                  │  │
│  │  Planning:  proposals                                     │  │
│  │  System:    recycle_bin                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
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

### Access

- **Web Interface**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs (debug mode only)

### Access

- **Web Interface**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs (debug mode only)

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

- [ ] Enable HTTPS (reverse proxy with nginx/caddy)
- [ ] Set up database backups
- [ ] Configure log rotation (already implemented in code)

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
