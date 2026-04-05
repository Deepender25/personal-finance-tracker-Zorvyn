<div align="center">
  <h1>🚀 FinanceDash</h1>
  <p><strong>Enterprise-Grade Financial Dashboard & Access Control System</strong></p>
  <p><em>Developed for the Zorvyn Backend Developer Intern Assessment</em></p>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </p>
</div>

## 📌 Project Overview

FinanceDash is a full-stack, high-performance financial management platform architected to demonstrate backend proficiency, clean code structuring, and modern API standards. Built as an assessment project, it emphasizes robust security, scalable code organization, and intuitive UI integration.

The application features a **Flask RESTful API** backend fortified with **JWT authentication** and granular **Role-Based Access Control (RBAC)**, seamlessly integrated with a modern **React 19 / Vite** frontend heavily customized with **Tailwind CSS** and **Framer Motion**.

---

## 🏗️ Architecture & Tech Stack

### Backend (API & Core Logic)
- **Framework:** Python Flask (RESTful routing)
- **Database:** PostgreSQL (leveraging Supabase) interfaced via `psycopg2`
- **Security & Auth:** `PyJWT` (Token blacklisting & auth), `bcrypt` (password hashing), `Flask-Limiter` (Rate limiting)
- **Architecture:** Layered design (Routing -> Controllers/Middlewares -> Services -> Database)

### Frontend (User Interface)
- **Core:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS V4 for a premium, responsive layout
- **Visualization & Animation:** Recharts for data analytics, Framer Motion for micro-interactions and smooth page transitions
- **Icons:** Lucide React

---

## ✨ Key Technical Achievements

1. **Robust Authentication & RBAC Hierarchy**
   - Implemented secure JWT-based authentication with stateless session verification.
   - Designed 3 distinct roles: `Admin`, `Analyst`, and `Viewer`, each with precisely mapped API permissions.
   - Built an active token blacklisting mechanism on logout to mitigate replay attacks.

2. **Clean Backend Architecture**
   - Separated business logic from route presentation.
   - Designed modular security middlewares that wrap routes dynamically based on required permission tiers.
   - Integrated robust cross-origin resource sharing (CORS) handling and environment management.

3. **High-Performance Analytics API**
   - Developed aggregation endpoints delivering ready-to-chart JSON payloads for Year-over-Year tracking, categorical breakdowns, and savings rate computations.
   - Structured JSON API to minimize client-side processing overloads.

4. **Modern UI/UX Implementation**
   - Transformed legacy HTML/Jinja interface to a decoupled React Single Page Application (SPA).
   - Implemented a "Bento-grid" dark mode design prioritizing aesthetics and layout efficiency.
   - Centralized API request logic with custom hooks and interceptors.

---

## 🛠️ Installation & Local Setup

### Prerequisites
- Node.js (v18+)
- Python 3.9+ 
- PostgreSQL Database URL (e.g., Supabase)

### 1. Clone & Environment Configuration

Clone the repository and jump into the project folder:

```bash
git clone <repository_url>
cd finance_dashboard
```

Create a `.env` file in the root directory (refer to `.env.example`):
```ini
DATABASE_URL="your-postgres-connection-string"
JWT_SECRET_KEY="your-secure-secret-key"
```

### 2. Backend Setup
Activate your environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Initialize the database schema:
```bash
python scripts/migrate.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Running the Application
We've included an automated script for Windows (`start.bat`) to launch both services simultaneously securely.
If running manually:

**Terminal 1 (Backend - Port 5000):**
```bash
# In the root 'finance_dashboard' directory
python run.py
```

**Terminal 2 (Frontend - Port 3000):**
```bash
# In the 'frontend' directory
npm run dev
```

Navigate to `http://localhost:3000` to access the dashboard.

---

## 📂 Repository Structure

```text
finance_dashboard/
├── app/                  # Backend application core
│   ├── middleware/       # Auth & RBAC security filters
│   ├── routes/           # REST API endpoints
│   └── services/         # Database and core business logic
├── frontend/             # React 19 / Vite SPA
│   ├── src/
│   │   ├── components/   # Reusable UI widgets
│   │   ├── pages/        # Dashboard layout views
│   │   └── lib/          # API utilities and configuration
├── migrations/           # Database schema files
├── scripts/              # Validation and maintenance utilities
└── tests/                # Pytest testing suite
```

---

## 🎯 Assessment Focus Areas Addressed
This submission directly highlights capabilities in:
- Building clean, maintainable, and scalable Python API systems.
- Designing strict Access Control flows and securing endpoints against unauthorized behaviors.
- Working independently with full-stack requirements and adapting modern React tooling.
- Maintaining disciplined project structuring, documentation, and module separation.

---
*Thank you for reviewing my application! Feel free to reach out with any questions regarding my technical decisions.*
