# GhostGuard

AI-powered ghost worker detection and payroll fraud prevention for Nigerian businesses.

GhostGuard combines GPS attendance, device fingerprinting, Squad payment rails, and a machine learning anomaly engine to flag suspicious payroll behavior before salaries are disbursed.

## What it does

- Detects ghost workers, proxy check-ins, and impossible travel using GPS and fingerprinting.
- Uses an Isolation Forest ML model to score payroll risk and generate trust verdicts.
- Integrates with Squad for bank account verification, wallet deposits, and payroll disbursements.
- Supports Admin, HR, and Worker workflows with role-based access.

## Repo structure

- `backend/` — FastAPI backend, Supabase integration, Squad payment orchestration, fraud scoring, and API endpoints.
- `frontend/` — Next.js 14 App Router frontend for auth, dashboards, attendance, HR review, and admin controls.
- `docs/` — Project documentation and pitch slide guidance.

## Key features

- GPS geofencing and attendance validation
- Device fingerprinting and buddy-punch detection
- Squad bank account lookup and transaction flows
- HR invite flow with Supabase email redirects
- Payroll run scoring with fraud signal analysis
- Wallet deposit and payout management
- Audit logs and multi-tenant company isolation

## Tech stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, Pydantic
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- ML: scikit-learn Isolation Forest
- Payments: Squad API
- Deployment: Vercel + Railway

## Getting started

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# fill in environment variables
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# fill in environment variables
npm run dev
```

## Environment variables

Required backend variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SQUAD_SECRET_KEY`
- `SQUAD_PUBLIC_KEY`
- `SQUAD_MERCHANT_ID`
- `SQUAD_BASE_URL`
- `SQUAD_CALLBACK_URL`
- `SQUAD_WEBHOOK_SECRET`
- `FRONTEND_URL`

Required frontend variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

## Documentation

- `docs/TECHNICAL.md` — full technical architecture and backend flow summary
- `docs/PITCH_SLIDES.md` — investor/demo pitch slide deck structure

## Notes

- HR invites use Supabase invite links redirected to `/auth/confirm` and then to `/hr/accept-invite`.
- Squad deposit flows require `initiate_type: inline` for checkout initiation.
- The backend links Supabase auth users to application profiles for admins, workers, and HR officers.

## Contact

For more details, open `backend/app/main.py` for the API entry point and `frontend/app` for the route structure.
