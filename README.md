# Finance Dashboard

A comprehensive full-stack Finance Dashboard showcasing standard backend interactions using Python/Flask and PostgreSQL via Supabase alongside secure Email OTP authentications and role-based frontend templates.

## Setup

1. Clone the repo (or use the existing localized folder)
2. Create virtual environment:
   `python -m venv venv`
   `source venv/bin/activate`       # Mac/Linux
   `venv\Scripts\activate`          # Windows

3. Install dependencies:
   `pip install -r requirements.txt`

4. Copy `.env.example` to `.env` and fill in your actual values:
   `cp .env.example .env`

5. Run schema in Supabase:
   Copy `migrations/schema.sql` into the Supabase SQL Editor and run it to construct tables and enum references.

6. Start the server:
   `python run.py`

7. Open http://localhost:5000 in your browser.

## Default Roles
- Register normally → gets `Viewer` role
- To assign `Analyst` or `Admin`, they must initially be managed directly via Supabase or altered through an already-authenticated admin user mapping the `/api/users` endpoints.

## Email Setup (Required for Registration)
- Ensure your sending Gmail account has 2-Step Verification (2FA) active.
- Navigate to Google Chrome -> My Account -> App Passwords. ([https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))
- Create an app password for 'Mail'.
- Insert the 16 characters string inside `GMAIL_APP_PASSWORD` variable located in `.env`.
