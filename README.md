# 💰 FinanceDash — Personal Finance Tracker

> **Enterprise-Grade Financial Dashboard & Access Control System**
> *Submitted for the Zorvyn Backend Developer Internship Assessment*

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-RESTful-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tested_with-Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org)

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Live Demo & Credentials](#-live-demo--credentials)
3. [System Architecture](#-system-architecture)
4. [Backend Deep Dive](#-backend-deep-dive)
   - [Layered Architecture](#layered-architecture)
   - [Authentication & JWT Flow](#authentication--jwt-flow)
   - [RBAC Permission Model](#rbac-permission-model)
   - [Database Schema](#database-schema)
   - [API Endpoint Reference](#api-endpoint-reference)
5. [Frontend Architecture](#-frontend-architecture)
6. [Request Lifecycle](#-request-lifecycle)
7. [Directory Structure](#-directory-structure)
8. [Tech Stack](#-tech-stack)
9. [Installation & Setup](#-installation--setup)
10. [Running Tests](#-running-tests)
11. [Key Design Decisions](#-key-design-decisions)
12. [Assessment Checklist](#-assessment-checklist)

---

## 🎯 Project Overview

**FinanceDash** is a production-quality, full-stack financial management platform built to demonstrate backend engineering proficiency at a professional level. The system enables users to track income, expenditures, and savings analytics through a secure, role-restricted REST API paired with a reactive single-page application.

### Core Highlights

| Area | What Was Built |
|---|---|
| **Security** | JWT-based auth with active token blacklisting on logout |
| **Access Control** | 3-tier RBAC: `Admin`, `Analyst`, `Viewer` — each with scoped permissions |
| **API Design** | RESTful endpoints returning analytics-ready JSON payloads |
| **Architecture** | Layered backend: Routes → Middleware → Services → Database |
| **Frontend** | Decoupled React 19 SPA with TypeScript, Vite, Recharts, Framer Motion |
| **Database** | PostgreSQL (via Supabase) with raw `psycopg2` for full control |
| **Rate Limiting** | Per-route request throttling via `Flask-Limiter` |
| **Testing** | Automated test suite with `pytest` covering auth & core flows |

---

## 🔐 Live Demo & Credentials

> If deployed, navigate to the URL below and use one of the pre-seeded test accounts to explore role-restricted views.

| Role | Email | Password | Access Level |
|---|---|---|---|
| Admin | admin@demo.try | `admin123` | Full CRUD + user management |
| Analyst | analyst@demo.try | `analyst123` | Read + analytics endpoints |
| Viewer | viewer@demo.try | `viewer123` | Dashboard view only |

> ⚠️ These credentials are for **assessment/demo purposes only** and are seeded via `scripts/seed.py`.

---

## 🏗️ System Architecture

### High-Level Overview

The system is divided into two independently runnable services — a Python/Flask backend exposing a REST API, and a React/Vite frontend SPA — communicating exclusively over HTTP/JSON.

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│   React 19 + TypeScript + Vite (Port 3000)                     │
│   ┌──────────┐  ┌───────────┐  ┌──────────────┐               │
│   │  Pages   │  │Components │  │ API lib (fetch│               │
│   │ Dashboard│  │ Charts/UI │  │  + interceptor│               │
│   └────┬─────┘  └─────┬─────┘  └──────┬───────┘               │
│        └──────────────┴───────────────┘                        │
│                         │ HTTP/JSON (CORS)                      │
└─────────────────────────┼──────────────────────────────────────┘
                           │
┌─────────────────────────▼──────────────────────────────────────┐
│                     BACKEND LAYER                               │
│   Flask RESTful API (Port 5000)                                 │
│                                                                  │
│  ┌─────────────┐   ┌───────────────┐   ┌──────────────────┐    │
│  │   Routes    │──▶│  Middleware   │──▶│    Services      │    │
│  │ /auth       │   │ JWT Verify    │   │ AuthService      │    │
│  │ /users      │   │ RBAC Guard    │   │ TransactionSvc   │    │
│  │ /transactions│  │ Rate Limiter  │   │ AnalyticsSvc     │    │
│  │ /analytics  │   │ CORS Handler  │   │ UserService      │    │
│  └─────────────┘   └───────────────┘   └──────┬───────────┘    │
│                                                │                │
└────────────────────────────────────────────────┼───────────────┘
                                                  │ psycopg2
┌─────────────────────────────────────────────────▼───────────────┐
│                     DATA LAYER                                   │
│   PostgreSQL via Supabase                                        │
│   ┌──────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│   │  users   │  │ transactions│  │  token_blacklist          │  │
│   └──────────┘  └─────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Backend Deep Dive

### Layered Architecture

The backend strictly follows a **Layered Architecture** pattern to separate concerns cleanly:

```mermaid
graph TD
    A[HTTP Request] --> B[Flask Routes Layer]
    B --> C{Middleware Pipeline}
    C --> D[JWT Verification]
    D --> E[RBAC Role Guard]
    E --> F[Rate Limiter]
    F --> G[Service Layer]
    G --> H[Database Layer - psycopg2]
    H --> I[(PostgreSQL / Supabase)]
    I --> H
    H --> G
    G --> J[JSON Response]
    J --> A

    style A fill:#1a1a2e,color:#fff,stroke:#4a9eff
    style B fill:#16213e,color:#fff,stroke:#4a9eff
    style C fill:#0f3460,color:#fff,stroke:#e94560
    style D fill:#533483,color:#fff,stroke:#e94560
    style E fill:#533483,color:#fff,stroke:#e94560
    style F fill:#533483,color:#fff,stroke:#e94560
    style G fill:#16213e,color:#fff,stroke:#4a9eff
    style H fill:#0f3460,color:#fff,stroke:#4a9eff
    style I fill:#1a1a2e,color:#00d4aa,stroke:#00d4aa
    style J fill:#16213e,color:#00d4aa,stroke:#00d4aa
```

**Each layer has one responsibility:**

- **Routes Layer** — Maps HTTP verbs + paths to handler functions. Zero business logic.
- **Middleware Layer** — Cross-cutting concerns: authentication, authorization, rate limiting, CORS.
- **Service Layer** — All business logic lives here. Handles database queries, data transformations, and analytics computations.
- **Database Layer** — Raw `psycopg2` connections. No ORM overhead. Full control over SQL.

---

### Authentication & JWT Flow

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Routes as Flask Routes
    participant Auth as Auth Middleware
    participant Service as AuthService
    participant DB as PostgreSQL
    participant BL as Token Blacklist

    Client->>Routes: POST /api/auth/login {email, password}
    Routes->>Service: validate_credentials(email, password)
    Service->>DB: SELECT user WHERE email = ?
    DB-->>Service: user record
    Service->>Service: bcrypt.verify(password, hash)
    Service-->>Routes: user object
    Routes->>Routes: jwt.encode({user_id, role, exp})
    Routes-->>Client: 200 OK {token, user}

    Note over Client,BL: Subsequent Protected Requests

    Client->>Routes: GET /api/transactions (Authorization: Bearer <token>)
    Routes->>Auth: verify_token(token)
    Auth->>BL: is_token_blacklisted(token)
    BL-->>Auth: false (token is valid)
    Auth->>Auth: jwt.decode(token, SECRET_KEY)
    Auth-->>Routes: decoded payload {user_id, role}
    Routes->>Service: get_transactions(user_id)
    Service->>DB: SELECT * FROM transactions WHERE user_id = ?
    DB-->>Service: rows
    Service-->>Routes: formatted data
    Routes-->>Client: 200 OK {transactions: [...]}

    Note over Client,BL: Logout Flow

    Client->>Routes: POST /api/auth/logout (Bearer <token>)
    Routes->>BL: blacklist_token(token, expiry)
    BL->>DB: INSERT INTO token_blacklist
    Routes-->>Client: 200 OK {message: "Logged out"}
```

**Security mechanisms applied:**
- Passwords stored as `bcrypt` hashes (never plaintext)
- JWT tokens signed with `HS256` algorithm using a secret from `.env`
- Token blacklisting on logout prevents replay attacks after session end
- Token expiry enforced server-side at every request

---

### RBAC Permission Model

The system implements a **three-tier Role-Based Access Control** model applied at the middleware layer, wrapping routes dynamically.

```mermaid
graph LR
    subgraph Roles["👥 Roles"]
        A[Admin]
        B[Analyst]
        C[Viewer]
    end

    subgraph Endpoints["🔌 API Endpoints"]
        E1[POST /transactions]
        E2[DELETE /transactions/:id]
        E3[GET /analytics/*]
        E4[GET /transactions]
        E5[GET /dashboard/summary]
        E6[GET /users - Admin Only]
        E7[PATCH /users/:id/role]
    end

    A -->|✅ Full Access| E1
    A -->|✅ Full Access| E2
    A -->|✅ Full Access| E3
    A -->|✅ Full Access| E4
    A -->|✅ Full Access| E5
    A -->|✅ Full Access| E6
    A -->|✅ Full Access| E7

    B -->|✅ Allowed| E3
    B -->|✅ Allowed| E4
    B -->|✅ Allowed| E5
    B -->|❌ Denied| E1
    B -->|❌ Denied| E2
    B -->|❌ Denied| E6

    C -->|✅ Allowed| E5
    C -->|❌ Denied| E1
    C -->|❌ Denied| E2
    C -->|❌ Denied| E3
    C -->|❌ Denied| E4
    C -->|❌ Denied| E6

    style A fill:#e94560,color:#fff,stroke:#e94560
    style B fill:#533483,color:#fff,stroke:#533483
    style C fill:#0f3460,color:#fff,stroke:#4a9eff
```

| Permission | Admin | Analyst | Viewer |
|---|:---:|:---:|:---:|
| View dashboard summary | ✅ | ✅ | ✅ |
| View transactions list | ✅ | ✅ | ❌ |
| View analytics endpoints | ✅ | ✅ | ❌ |
| Create transactions | ✅ | ❌ | ❌ |
| Edit / Delete transactions | ✅ | ❌ | ❌ |
| Manage users & roles | ✅ | ❌ | ❌ |

---

### Database Schema

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email
        varchar password_hash
        varchar name
        varchar role
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        varchar type
        varchar category
        decimal amount
        text description
        date transaction_date
        timestamp created_at
    }

    TOKEN_BLACKLIST {
        uuid id PK
        text token
        timestamp blacklisted_at
        timestamp expires_at
    }

    USERS ||--o{ TRANSACTIONS : "has many"
    USERS ||--o{ TOKEN_BLACKLIST : "invalidates"
```

**Schema decisions:**
- `UUIDs` over auto-increment IDs to prevent ID enumeration attacks
- `role` stored directly on the user record — simpler than a join table for a 3-role system
- `token_blacklist` expires_at column enables future cron-based cleanup of stale blacklisted tokens
- Migrations tracked in `/migrations/` for reproducible schema changes

---

### API Endpoint Reference

#### Auth Routes — `/api/auth`

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|:---:|---|---|
| `POST` | `/api/auth/register` | ❌ | Public | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Public | Login and receive JWT |
| `POST` | `/api/auth/logout` | ✅ | Any | Invalidate current token |
| `GET` | `/api/auth/me` | ✅ | Any | Get current user profile |

#### Transaction Routes — `/api/transactions`

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|:---:|---|---|
| `GET` | `/api/transactions` | ✅ | Admin, Analyst | List all user transactions |
| `POST` | `/api/transactions` | ✅ | Admin | Create new transaction |
| `GET` | `/api/transactions/:id` | ✅ | Admin, Analyst | Get single transaction |
| `PUT` | `/api/transactions/:id` | ✅ | Admin | Update transaction |
| `DELETE` | `/api/transactions/:id` | ✅ | Admin | Delete transaction |

#### Analytics Routes — `/api/analytics`

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|:---:|---|---|
| `GET` | `/api/analytics/summary` | ✅ | Admin, Analyst | Income / expense / savings totals |
| `GET` | `/api/analytics/monthly` | ✅ | Admin, Analyst | Month-over-month breakdown |
| `GET` | `/api/analytics/by-category` | ✅ | Admin, Analyst | Spending by category |
| `GET` | `/api/analytics/savings-rate` | ✅ | Admin, Analyst | Savings rate over time |

#### User Management Routes — `/api/users`

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|:---:|---|---|
| `GET` | `/api/users` | ✅ | Admin | List all users |
| `PATCH` | `/api/users/:id/role` | ✅ | Admin | Update user role |
| `DELETE` | `/api/users/:id` | ✅ | Admin | Remove a user |

---

## 🖥️ Frontend Architecture

The frontend is a **fully decoupled React SPA** built with Vite and TypeScript, communicating with the backend exclusively via the REST API.

```mermaid
graph TD
    subgraph SPA["React 19 SPA (Vite)"]
        App[App.tsx - Router Root]

        subgraph Pages
            Login[Login Page]
            Dashboard[Dashboard Page]
            Transactions[Transactions Page]
            Analytics[Analytics Page]
            Users[Users Page - Admin]
        end

        subgraph Components
            Navbar[Navbar Component]
            Charts[Recharts Components]
            Table[Transaction Table]
            Modal[CRUD Modals]
        end

        subgraph Lib["lib/ - API Layer"]
            APIClient[api.ts - Fetch Client]
            AuthHook[useAuth Hook]
            RBACGuard[ProtectedRoute]
        end

        subgraph State["State Management"]
            LocalState[useState / useReducer]
            Context[AuthContext]
        end
    end

    App --> Pages
    App --> Components
    Pages --> Lib
    Components --> Lib
    Lib --> APIClient
    APIClient -->|JWT Header Interceptor| Backend[(Flask Backend :5000)]

    style App fill:#20232A,color:#61DAFB,stroke:#61DAFB
    style Backend fill:#1a1a2e,color:#00d4aa,stroke:#00d4aa
```

**Key Frontend patterns:**
- `AuthContext` provides global auth state and role information to all components
- `ProtectedRoute` wrapper redirects unauthenticated or unauthorized users before rendering
- Custom `api.ts` abstraction automatically attaches `Authorization: Bearer <token>` headers to every request
- Recharts consumes the analytics API directly — no client-side data aggregation needed

---

## 🔄 Request Lifecycle

A complete diagram of what happens from button click to database and back:

```mermaid
flowchart TD
    U([User Clicks 'Add Transaction']) --> FE[React Component calls api.ts]
    FE --> REQ[HTTP POST /api/transactions\nAuthorization: Bearer token\nBody: JSON payload]
    REQ --> CORS[Flask CORS Middleware\nValidates origin]
    CORS --> RL[Flask-Limiter\nChecks rate limit]
    RL --> JWT[JWT Middleware\nDecodes & verifies token]
    JWT --> BL{Token\nBlacklisted?}
    BL -->|Yes| R401[401 Unauthorized]
    BL -->|No| RBAC[RBAC Middleware\nChecks role permissions]
    RBAC -->|Insufficient Role| R403[403 Forbidden]
    RBAC -->|Authorized| ROUTE[Route Handler]
    ROUTE --> SVC[TransactionService\nValidates & transforms data]
    SVC --> SQL[psycopg2\nINSERT INTO transactions]
    SQL --> PG[(PostgreSQL)]
    PG -->|Inserted Row| SQL
    SQL --> SVC
    SVC --> ROUTE
    ROUTE --> R201[201 Created\nJSON response]
    R201 --> FE
    FE --> UI[UI Updates with new transaction]

    style U fill:#e94560,color:#fff
    style PG fill:#316192,color:#fff
    style R401 fill:#ff4444,color:#fff
    style R403 fill:#ff8800,color:#fff
    style R201 fill:#00aa44,color:#fff
```

---

## 📂 Directory Structure

```
personal-finance-tracker-Zorvyn/
│
├── app/                          # Backend application core
│   ├── __init__.py               # Flask app factory, CORS, Limiter init
│   ├── middleware/               # Cross-cutting security concerns
│   │   ├── auth_middleware.py    # JWT decode & token blacklist check
│   │   └── rbac_middleware.py    # Role-based permission decorator
│   ├── routes/                   # HTTP endpoint definitions (thin layer)
│   │   ├── auth_routes.py        # /api/auth/*
│   │   ├── transaction_routes.py # /api/transactions/*
│   │   ├── analytics_routes.py   # /api/analytics/*
│   │   └── user_routes.py        # /api/users/*
│   └── services/                 # Business logic + database queries
│       ├── auth_service.py       # Login, register, blacklist logic
│       ├── transaction_service.py# CRUD + validation
│       ├── analytics_service.py  # Aggregation, YoY, savings rate
│       └── user_service.py       # User management
│
├── frontend/                     # React 19 / Vite SPA
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, Cards, Charts)
│   │   ├── pages/                # Full page views (Dashboard, Transactions, etc.)
│   │   └── lib/                  # API client, auth context, route guards
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── migrations/                   # Versioned SQL schema files
│   └── 001_initial_schema.sql    # Users, transactions, token_blacklist tables
│
├── scripts/                      # Utility scripts
│   ├── migrate.py                # Runs migrations against the DB
│   └── seed.py                   # Seeds test users with hashed passwords
│
├── tests/                        # Pytest test suite
│   ├── test_auth.py              # Registration, login, logout, token tests
│   └── test_transactions.py      # CRUD + RBAC enforcement tests
│
├── .env.example                  # Environment variable template
├── .gitignore
├── pytest.ini                    # Pytest configuration
├── requirements.txt              # Python dependencies
├── run.py                        # Flask application entry point
└── start.bat                     # Windows: launches both services together
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.9+ | Core runtime |
| Flask | 3.x | REST API framework |
| psycopg2 | 2.9+ | PostgreSQL driver (no ORM) |
| PyJWT | 2.x | JWT token generation & verification |
| bcrypt | 4.x | Password hashing |
| Flask-Limiter | 3.x | Rate limiting per route |
| Flask-CORS | 4.x | Cross-Origin Resource Sharing |
| pytest | 7.x | Test framework |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | v4 | Utility-first styling |
| Recharts | 2.x | Financial data visualization |
| Framer Motion | 11.x | Animations & page transitions |
| Lucide React | latest | Icon system |

### Infrastructure

| Component | Technology |
|---|---|
| Database | PostgreSQL (hosted on Supabase) |
| Auth Storage | JWT (stateless) + server-side blacklist |
| API Protocol | REST / JSON |
| Dev Automation | `start.bat` (Windows concurrent launcher) |

---

## ⚙️ Installation & Setup

### Prerequisites

- Python **3.9+**
- Node.js **18+** and npm
- A PostgreSQL connection string (e.g., from [Supabase](https://supabase.com) — free tier works)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Deepender25/personal-finance-tracker-Zorvyn.git
cd personal-finance-tracker-Zorvyn
```

---

### Step 2 — Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# PostgreSQL connection string (Supabase or local)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Strong random string — used to sign JWT tokens
JWT_SECRET_KEY=your-very-secure-random-secret-key

# Flask environment
FLASK_ENV=development
FLASK_DEBUG=1
```

---

### Step 3 — Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (creates all tables)
python scripts/migrate.py

# (Optional) Seed demo users
python scripts/seed.py
```

---

### Step 4 — Frontend Setup

```bash
cd frontend
npm install
cd ..
```

---

### Step 5 — Run the Application

**Option A — Windows (Automated):**

```bash
start.bat
```
This script launches both services simultaneously in separate terminals.

**Option B — Manual (Two terminals):**

Terminal 1 — Backend:
```bash
# From project root, with venv activated
python run.py
# API running at http://localhost:5000
```

Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
# App running at http://localhost:3000
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Running Tests

The test suite uses `pytest` and covers authentication flows, RBAC enforcement, and transaction CRUD operations.

```bash
# From the project root, with venv activated
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_auth.py -v

# Run with coverage report
pytest --cov=app tests/
```

**Test coverage areas:**
- User registration with duplicate email handling
- Login with valid / invalid credentials
- JWT token generation and expiry validation
- Token blacklisting on logout (replay attack prevention)
- Transaction CRUD with ownership validation
- RBAC enforcement — Analyst and Viewer blocked from write endpoints
- Analytics endpoint data integrity

---

## 🎨 Key Design Decisions

### Why no ORM (SQLAlchemy)?

Using raw `psycopg2` provides full control over SQL queries, avoids hidden N+1 query problems, and demonstrates deeper database proficiency. All queries are parameterized to prevent SQL injection.

### Why JWT with blacklisting?

Stateless JWT is ideal for horizontal scaling, but pure stateless auth can't revoke tokens before expiry. The blacklist table bridges this gap — tokens are invalidated on logout while keeping auth logic fast on every request.

### Why a layered service architecture over MVC?

MVC can blur business logic into controllers. The Service Layer pattern ensures that if the HTTP framework changes, business logic is untouched. It also makes unit testing trivial — services can be tested without HTTP context.

### Why Supabase PostgreSQL?

Supabase provides a fully managed PostgreSQL instance accessible over a standard connection string, eliminating local database setup overhead during assessment review. The `psycopg2` driver treats it identically to any PostgreSQL host.

### Why React 19 + Vite over Jinja2 templates?

Server-side rendering via Jinja2 tightly couples frontend to backend deployments. A decoupled SPA enables the frontend to be deployed independently (CDN/Vercel), reduces backend complexity, and reflects modern production architectures.

---

## ✅ Assessment Checklist

This project directly addresses the following backend engineering competencies:

- [x] **RESTful API Design** — Consistent route naming, HTTP verbs, and status codes
- [x] **Authentication** — Secure JWT-based auth with bcrypt password hashing
- [x] **Authorization** — Granular RBAC with 3 distinct permission tiers
- [x] **Database Design** — Normalized schema with migrations and seed scripts
- [x] **Security** — Token blacklisting, rate limiting, CORS, parameterized queries
- [x] **Code Organization** — Strict separation of routes, middleware, and services
- [x] **Testing** — Automated pytest suite covering auth and CRUD flows
- [x] **Documentation** — Inline docstrings, type hints, and this README
- [x] **Environment Management** — `.env` driven configuration, `.env.example` provided
- [x] **Frontend Integration** — Fully decoupled React SPA demonstrating API consumption

---

## 👤 Author

**Deepender** — Backend Developer Intern Candidate

> *Thank you for taking the time to review this submission. Every architectural decision in this project was intentional — from the layered service pattern to the active token blacklist. I am happy to walk through any part of the codebase in detail.*

---

<div align="center">

**Built with 🔥 for the Zorvyn Backend Developer Internship Assessment**

</div>