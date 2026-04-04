# FinanceDash — Enterprise Finance Data & Access Control

A high-performance, secure, and intuitive Finance Management Platform built for entry-level backend architectural excellence. This project demonstrates robust Role-Based Access Control (RBAC), real-time financial analytics, automated recurring transactions, and a professional, emoji-free user interface using modern SVG iconography.

## 🚀 Key Features

### 🔐 Security & Access Control
- **Advanced RBAC**: Granular permissions for `Admin`, `Analyst`, and `Viewer` roles.
- **JWT Authentication**: Secure session management with industry-standard token-based auth.
- **Token Blacklisting**: Real-time token invalidation on logout to prevent replay attacks.
- **API Key Management**: Self-service generation of API keys for programmatic access.
- **Audit Logging**: Comprehensive, non-blocking background logging of all critical system actions.

### 📊 Financial Intelligence
- **Real-time Analytics**: Yearly trends, Year-over-Year (YoY) comparisons, and category-wise breakdowns.
- **Savings Rate Tracking**: Automatic calculation of savings percentage and retained capital.
- **Expense Heatmaps**: Visual frequency tracking of daily spending patterns.
- **Budgeting Engine**: Category-specific spending limits with automated status alerts (OK / Warning / Over).

### ⚙️ Automation & Data Management
- **Recurring Transactions**: Flexible scheduling (Daily, Weekly, Monthly, Yearly) with automated "Due Now" processing.
- **Many-to-Many Tagging**: Advanced transaction labeling system with auto-tag creation and usage tracking.
- **CSV Bulk Import**: Drag-and-drop CSV processing for historical data migration.
- **CSV Export**: Filtered data extraction for external spreadsheet analysis.

## 🛠️ Tech Stack
- **Backend**: Python 3.x, Flask (RESTful Architecture)
- **Database**: PostgreSQL (Supabase) with `psycopg2`
- **Security**: `PyJWT`, `bcrypt`, `Flask-Limiter`
- **Frontend**: Vanilla JS (ES6+), HTML5, CSS3 (Custom Design System), `Chart.js`
- **Testing**: `pytest`, `pytest-flask`

## 📦 Installation & Setup

1. **Environment Configuration**:
   Create a `.env` file from the example and provide your credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET_KEY`: A secure random string.
   - `GMAIL_ADDRESS` & `GMAIL_APP_PASSWORD`: For OTP verification emails.

2. **Initialize Database**:
   Run the migration tool to apply the latest enterprise schema:
   ```bash
   python scripts/migrate.py
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch Application**:
   ```bash
   python run.py
   ```
   Access the dashboard at `http://localhost:5000`.

## 🧪 Testing
The project includes a comprehensive suite to ensure reliability. You can run tests directly:
```bash
pytest
```
*Note: If you encounter import errors, use `python -m pytest` instead.*

## 📂 Project Structure
- `app/services`: Core business logic and database abstractions.
- `app/routes`: RESTful API endpoints organized by domain.
- `app/middleware`: Security filters, RBAC, and Auth validation.
- `app/templates`: Role-specific dashboard layouts and professional UI.
- `static/js`: Interactive dashboard logic and charting.
- `migrations`: Version-controlled SQL schema updates.
- `scripts`: Maintenance and migration utilities.

---
*Developed for the Zorvyn Backend Developer Intern Project.*
