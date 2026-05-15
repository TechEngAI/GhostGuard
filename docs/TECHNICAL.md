# GhostGuard Technical Documentation

## 1. SYSTEM OVERVIEW

GhostGuard is a monorepo with `frontend/` and `backend/` working together:

- `backend/` — FastAPI backend for authentication, payroll orchestration, Squad integration, fraud scoring, and data access.
- `frontend/` — Next.js 14 App Router for admin, worker, and HR portals.

The system is a three-tier architecture:

- Presentation layer: Next.js UI and reusable components.
- Business logic layer: FastAPI services, auth rules, and ML scoring.
- Data layer: Supabase PostgreSQL tables and Squad transaction records.

Three user types and permissions:

- Admin — company owner/superuser, role management, worker onboarding, payroll setup, wallet deposits.
- Worker — worker onboarding, bank verification, GPS attendance, payslip access.
- HR — invite management, payroll review, receipt approval, payment retries.

## 2. BACKEND ARCHITECTURE

The backend uses FastAPI with modular routers and services.

### Folder structure

- `backend/app/main.py` — FastAPI application entry point.
- `backend/app/config.py` — environment settings loader.
- `backend/app/database.py` — Supabase client providers.
- `backend/app/dependencies.py` — auth dependency injection.
- `backend/app/errors.py` — standardized response helpers.
- `backend/app/auth/` — shared auth logic and schemas.
- `backend/app/admin/` — admin management router, schemas, and service.
- `backend/app/worker/` — worker profile and bank flows.
- `backend/app/hr/` — HR invite, payments, and receipt workflows.
- `backend/app/attendance/` — check-in/check-out and attendance editing.
- `backend/app/payroll/` — payroll run generation and disbursement.
- `backend/app/fraud/` — fraud signal listing and ML integration.
- `backend/app/ml/` — feature engineering and isolation forest scoring.
- `backend/app/wallet/` — wallet overview, deposit initiation, and webhook handling.
- `backend/app/squad/` — Squad payment and transfer helpers.

### Dependency injection pattern

Dependencies are used to enforce authorization on protected routes.

- `get_current_admin` — validates admin JWT and returns admin context.
- `get_current_worker` — validates worker JWT and returns worker context.
- `get_current_hr` — validates HR JWT and returns HR context.

These are wired into FastAPI route signatures with `Depends(...)`.

### Supabase Auth and custom tables

Supabase auth users are linked to GhostGuard profile rows via `auth_user_id`:

- `admins.auth_user_id` references `auth.users(id)`
- `workers.auth_user_id` references `auth.users(id)`
- `hr_officers.auth_user_id` references `auth.users(id)`

This allows Supabase-managed auth state to connect to application profile data.

### Error response format

Backend responses use a JSON success structure with `success`, `data`, and `message` fields. Errors are raised as HTTP exceptions with structured codes.

### Audit logging strategy

Every admin mutation writes an audit log to `audit_logs` with:

- `actor_id`, `actor_type`
- `action`
- `target_id`, `target_type`
- `metadata`
- `ip_address`

This creates an audit trail for role invites, bank approvals, payroll decisions, and wallet actions.

## 3. DATABASE SCHEMA

### companies

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(255) | company name |
| industry | VARCHAR(100) | |
| size | VARCHAR(50) | |
| office_lat | DECIMAL(10,8) | office latitude |
| office_lng | DECIMAL(11,8) | office longitude |
| geofence_radius | INTEGER | default 100 |
| work_start_time | TIME | default 08:00 |
| work_end_time | TIME | default 18:00 |
| working_days | VARCHAR(20) | default MON-FRI |
| payroll_cycle | VARCHAR(20) | default MONTHLY |
| timezone | VARCHAR(50) | default Africa/Lagos |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: company profile and geofence parameters.

### admins

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| auth_user_id | UUID | unique Supabase auth user reference |
| company_id | UUID | company reference |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| middle_name | VARCHAR(100) | |
| email | VARCHAR(255) | unique |
| phone_number | VARCHAR(20) | unique |
| gender | VARCHAR(20) | |
| date_of_birth | DATE | |
| status | VARCHAR(20) | default ACTIVE |
| verif_channel | VARCHAR(10) | default email |
| last_login | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: admin user profile data.

### roles

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| company_id | UUID | company reference |
| role_name | VARCHAR(150) | |
| department | VARCHAR(100) | |
| grade_level | VARCHAR(50) | |
| headcount_max | INTEGER | |
| headcount_filled | INTEGER | default 0 |
| gross_salary | DECIMAL(15,2) | |
| pension_deduct | DECIMAL(15,2) | default 0 |
| health_deduct | DECIMAL(15,2) | default 0 |
| other_deductions | DECIMAL(15,2) | default 0 |
| work_type | VARCHAR(20) | default ONSITE |
| invite_code | VARCHAR(30) | unique |
| code_active | BOOLEAN | default TRUE |
| created_at | TIMESTAMPTZ | default NOW() |
| updated_at | TIMESTAMPTZ | default NOW() |

Purpose: payroll roles, worker invite codes, and compensation rules.

### workers

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| auth_user_id | UUID | unique Supabase auth user reference |
| company_id | UUID | company reference |
| role_id | UUID | role reference |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| middle_name | VARCHAR(100) | |
| email | VARCHAR(255) | unique |
| phone_number | VARCHAR(20) | unique |
| gender | VARCHAR(20) | |
| date_of_birth | DATE | |
| home_address | TEXT | |
| state_of_origin | VARCHAR(100) | |
| next_of_kin_name | VARCHAR(200) | |
| next_of_kin_phone | VARCHAR(20) | |
| emergency_contact_name | VARCHAR(200) | |
| emergency_contact_phone | VARCHAR(20) | |
| nin | VARCHAR(20) | |
| bank_verified | BOOLEAN | default FALSE |
| status | VARCHAR(20) | default PENDING_BANK |
| verif_channel | VARCHAR(10) | default email |
| completeness_score | DECIMAL(3,2) | default 0.00 |
| has_company_device | BOOLEAN | default FALSE |
| device_id | VARCHAR(255) | fingerprint ID |
| last_login | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: worker profile and onboarding state.

### worker_bank_accounts

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| worker_id | UUID | worker reference |
| bank_name | VARCHAR(100) | |
| bank_code | VARCHAR(10) | |
| account_number | VARCHAR(20) | |
| account_name | VARCHAR(200) | |
| match_score | DECIMAL(5,2) | Squad match score |
| match_status | VARCHAR(20) | |
| is_active | BOOLEAN | default TRUE |
| verified_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: verified payment bank details for each worker.

### bank_account_history

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| worker_id | UUID | worker reference |
| old_account | VARCHAR(20) | |
| new_account | VARCHAR(20) | |
| old_bank_code | VARCHAR(10) | |
| new_bank_code | VARCHAR(10) | |
| changed_at | TIMESTAMPTZ | default NOW() |
| approved_by | UUID | admin reference |
| reason | TEXT | |

Purpose: bank change audit and velocity detection.

### audit_logs

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| actor_id | UUID | user performing action |
| actor_type | VARCHAR(10) | admin/worker/hr |
| action | VARCHAR(100) | audited action |
| target_id | UUID | affected record |
| target_type | VARCHAR(20) | |
| metadata | JSONB | action details |
| ip_address | VARCHAR(45) | |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: audit trail for sensitive operations.

### attendance_records

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| worker_id | UUID | worker reference |
| company_id | UUID | company reference |
| check_in_time | TIMESTAMPTZ | |
| check_out_time | TIMESTAMPTZ | |
| check_in_lat | DECIMAL(10,8) | |
| check_in_lng | DECIMAL(11,8) | |
| check_out_lat | DECIMAL(10,8) | |
| check_out_lng | DECIMAL(11,8) | |
| distance_from_office | DECIMAL(10,2) | |
| hours_worked | DECIMAL(5,2) | |
| is_late | BOOLEAN | default FALSE |
| boundary_hugging | BOOLEAN | default FALSE |
| is_manual_edit | BOOLEAN | default FALSE |
| edited_by | UUID | admin reference |
| edited_at | TIMESTAMPTZ | |
| edit_reason | TEXT | |
| device_id | VARCHAR(255) | fingerprint ID |
| ip_address | VARCHAR(45) | |
| user_agent | TEXT | |
| status | VARCHAR(20) | default OPEN |
| month_year | VARCHAR(7) | |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: attendance events for ML and compliance.

### fraud_signals

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| worker_id | UUID | worker reference |
| company_id | UUID | company reference |
| signal_type | VARCHAR(50) | e.g. IMPOSSIBLE_TRAVEL |
| severity | VARCHAR(20) | default HIGH |
| metadata | JSONB | signal details |
| is_reviewed | BOOLEAN | default FALSE |
| reviewed_by | UUID | admin reference |
| reviewed_at | TIMESTAMPTZ | |
| review_note | TEXT | |
| detected_at | TIMESTAMPTZ | default NOW() |

Purpose: store individual fraud signals used in scoring.

### payroll_runs

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| company_id | UUID | company reference |
| month_year | VARCHAR(7) | |
| month | INTEGER | |
| year | INTEGER | |
| total_workers | INTEGER | |
| flagged_count | INTEGER | default 0 |
| suspicious_count | INTEGER | default 0 |
| verified_count | INTEGER | default 0 |
| status | VARCHAR(20) | default PENDING |
| generated_by | UUID | admin reference |
| generated_at | TIMESTAMPTZ | default NOW() |
| csv_data | JSONB | |
| approved_by | UUID | admin reference |
| approved_at | TIMESTAMPTZ | |

Purpose: payroll batch lifecycle and status.

### ghost_analysis_results

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| payroll_run_id | UUID | payroll run reference |
| worker_id | UUID | worker reference |
| company_id | UUID | company reference |
| trust_score | DECIMAL(5,2) | 0-100 |
| anomaly_score | DECIMAL(8,6) | model score |
| verdict | VARCHAR(20) | VERIFIED/SUSPICIOUS/FLAGGED |
| flag_reasons | JSONB | |
| feature_values | JSONB | raw features |
| days_present | INTEGER | |
| days_absent | INTEGER | |
| gross_salary | DECIMAL(15,2) | |
| hr_decision | VARCHAR(20) | |
| hr_reviewed_by | UUID | admin reference |
| hr_reviewed_at | TIMESTAMPTZ | |
| hr_note | TEXT | |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: scored payroll worker records.

### payment_receipts

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| payroll_run_id | UUID | payroll run reference |
| worker_id | UUID | worker reference |
| company_id | UUID | company reference |
| squad_tx_id | VARCHAR(255) | Squad transaction ID |
| squad_reference | VARCHAR(255) | unique payout reference |
| squad_status | VARCHAR(20) | default PENDING |
| gross_salary | DECIMAL(15,2) | |
| total_deductions | DECIMAL(15,2) | |
| net_pay | DECIMAL(15,2) | |
| amount_kobo | BIGINT | |
| bank_account_number | VARCHAR(20) | |
| bank_code | VARCHAR(10) | |
| bank_name | VARCHAR(100) | |
| account_name | VARCHAR(200) | |
| trust_score | DECIMAL(5,2) | |
| verdict | VARCHAR(20) | |
| days_present | INTEGER | |
| hr_decision | VARCHAR(20) | |
| hr_note | TEXT | |
| paid_at | TIMESTAMPTZ | |
| failure_reason | TEXT | |
| month_year | VARCHAR(7) | |
| created_at | TIMESTAMPTZ | default NOW() |

Purpose: payment receipts and payout status.

### company_wallet

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| company_id | UUID | unique company reference |
| balance_kobo | BIGINT | current available balance |
| total_deposited_kobo | BIGINT | lifetime deposit total |
| total_disbursed_kobo | BIGINT | lifetime disbursement total |
| last_deposit_at | TIMESTAMPTZ | |
| last_disburse_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | default NOW() |
| updated_at | TIMESTAMPTZ | default NOW() |

Purpose: company balance tracking for Squad wallet funds.

### wallet_transactions

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| company_id | UUID | company reference |
| type | VARCHAR(20) | DEPOSIT/DISBURSEMENT/REVERSAL |
| amount_kobo | BIGINT | |
| amount_ngn | DECIMAL(15,2) | generated from kobo |
| squad_reference | VARCHAR(255) | GhostGuard reference |
| squad_tx_id | VARCHAR(255) | Squad transaction ID |
| squad_nip_ref | VARCHAR(255) | NIP session ID |
| status | VARCHAR(20) | PENDING/SUCCESS/FAILED/Reversed |
| description | TEXT | |
| worker_id | UUID | optional payout worker reference |
| payroll_run_id | UUID | optional payroll reference |
| failure_reason | TEXT | |
| squad_response | JSONB | full Squad response |
| created_at | TIMESTAMPTZ | default NOW() |
| updated_at | TIMESTAMPTZ | default NOW() |

Purpose: full audit trail of wallet cashflows.

## 4. AUTHENTICATION FLOW

### Admin registration

1. Admin signs up via `POST /auth/admin/register`.
2. Backend calls Supabase sign_up and sends verification.
3. Admin confirms with OTP via `POST /auth/admin/verify-otp`.
4. After verification, admin uses `POST /auth/admin/login`.

### Worker registration

1. Admin creates a role and worker invite code.
2. Worker signs up via `POST /auth/worker/register`.
3. Worker receives verification email and validates OTP via `POST /auth/worker/verify-otp`.
4. Worker completes bank verification and check-in flows.

### HR creation and invite flow

1. Admin invites HR via `POST /admin/hr/create`.
2. Backend sends Supabase invite with `redirect_to` to `/auth/confirm`.
3. HR clicks the email link, which lands on Next.js confirm page.
4. `auth/confirm` calls Supabase `verifyOtp({ token_hash, type: 'invite' })`.
5. HR is redirected to `/hr/accept-invite` to set a password.
6. After setting a password, HR is sent to `/hr/login?activated=true`.

### Token lifecycle

- Access tokens are validated via backend Supabase auth client.
- Refresh tokens are exchanged via `POST /auth/*/refresh`.
- Logout invalidates access tokens in backend auth service.

## 5. GPS ATTENDANCE SYSTEM

### Haversine-style distance validation

Workers submit latitude, longitude, and accuracy from the browser geolocation API.
The backend computes distance from the company office location and enforces the company geofence.

### Geofence and accuracy buffer

The company geofence default is 100 meters. The system uses the supplied GPS accuracy and adds a buffer to allow realistic device drift.

### Remote role bypass

Remote or offsite worker roles are supported through role metadata, but the core check-in flow is built for onsite attendance.

### Impossible travel detection

The app flags impossible travel when worker location jumps exceed physical limits between attendance records. The threshold is modeled around a 200 km/h speed bound.

## 6. DEVICE FINGERPRINTING

### FingerprintJS integration

Frontend uses `@fingerprintjs/fingerprintjs`.
The `useDeviceFingerprint()` hook loads the library and returns `visitorId`.

### Collection point

`useDeviceFingerprint()` is called in worker attendance components such as `CheckInCard` and `worker/dashboard/page.tsx`.

### Storage

The `device_id` is stored in `attendance_records.device_id`.

### Buddy-punch detection

`device_shared_count` is computed from fraud signals of type `DEVICE_SHARED`. Shared device use is flagged when multiple workers check in from the same fingerprint.

## 7. ML GHOST DETECTION ENGINE

### Isolation Forest

GhostGuard uses `IsolationForest` from scikit-learn with:

- `contamination=0.10`
- `n_estimators=200`
- `random_state=42`
- `max_samples='auto'`

### Feature engineering

The 10 features are computed in `backend/app/ml/features.py`:

- `days_present_ratio` — attended days divided by working days.
- `checkin_time_std_dev` — standard deviation of check-in minutes.
- `gps_boundary_score` — fraction of check-ins close to the geofence boundary.
- `device_shared_count` — maximum shared-device count from fraud signals.
- `impossible_travel_count` — count of `IMPOSSIBLE_TRAVEL` fraud signals.
- `peer_checkin_correlation` — highest correlation with other worker check-in times.
- `bank_change_velocity` — bank changes in the last 90 days normalized over 3 months.
- `completeness_score` — worker profile completeness.
- `deduction_ratio` — deductions / gross salary.
- `login_to_checkin_gap` — average minutes between last login and check-in.

### StandardScaler preprocessing

Features are scaled with `StandardScaler` before model scoring.

### Score normalization

Raw anomaly scores are min-max normalized to 0-100.

### Verdict thresholds

- `VERIFIED` — trust score ≥ 70
- `SUSPICIOUS` — 40 ≤ trust score < 70
- `FLAGGED` — trust score < 40

### Flag reason logic

The engine generates flag reasons from 11 rules, including:

- low attendance ratio
- zero attendance
- overly consistent check-in times
- boundary-hugging GPS patterns
- shared device use
- impossible travel
- peer check-in correlation
- rapid bank changes
- low profile completeness
- low deduction ratio
- large login-to-checkin gaps

### Edge case handling

If fewer than 5 workers exist, the engine returns a default `SUSPICIOUS` verdict with a manual review rationale.

## 8. SQUAD INTEGRATION

### Account lookup flow

Frontend worker bank submission calls backend worker bank lookup endpoints.
Backend uses Squad account lookup APIs to confirm bank name, account number, and account holder identity.

### Fuzzy name matching

The backend implements fuzzy matching logic in `backend/app/squad/payout.py` and `backend/app/squad/transfer.py` to compare multiple name orderings and select the best match.

### Wallet deposit flow

1. Admin calls `POST /admin/wallet/initiate-deposit`.
2. Backend creates a Squad `transaction/initiate` payload with `initiate_type: inline`.
3. Squad returns a checkout URL.
4. Payment success is confirmed through `GET /transaction/verify/{transaction_ref}`.
5. `company_wallet` and `wallet_transactions` are updated.

### Fund transfer flow

Payroll approval triggers Squad payout transfer logic, with:

- account lookup
- transfer initiation
- requery on timeout or failure

### Transaction reference format

`MERCHANTID_{company_short}_{timestamp}`

This ensures unique, auditable Squad references.

### Webhook validation

The backend validates Squad webhook signatures using HMAC SHA512 with `SQUAD_WEBHOOK_SECRET`.

### Feature flag

`USE_SQUAD_LOOKUP` toggles Squad lookup behavior for development mode.

## 9. FRAUD SIGNAL TYPES

### IMPOSSIBLE_TRAVEL

Detects physically impossible GPS jumps between attendance records.
Severity: high.

### DEVICE_SHARED

Detects multiple workers using the same fingerprint device ID.
Severity: high.

### GPS_BOUNDARY_HUGGING

Detects repeated check-ins at the geofence edge.
Severity: medium.

### APPROVAL_PATH_ANOMALY

Detects suspicious HR/admin approval or invite patterns.
Severity: high.

### BANK_VELOCITY

Detects rapid bank account changes within 90 days.
Severity: medium.

These signals feed the GhostGuard ML engine and HR review dashboards.

## 10. PAYROLL FLOW

1. Admin creates roles and worker invite codes.
2. Workers register, verify email, and verify bank accounts.
3. Workers check in and check out with GPS, device fingerprint, and attendance data.
4. Attendance records are stored in `attendance_records` and fraud signals are generated.
5. Payroll is generated and feature rows are computed per worker.
6. ML scores workers in `ghost_analysis_results`.
7. HR reviews the trust scores and marks decisions.
8. HR approves payroll and payout disbursement begins.
9. Squad transfers funds and `payment_receipts` are recorded.
10. Workers retrieve payslips with payout status and Squad TX IDs.

## 11. FRONTEND ARCHITECTURE

### App Router structure

The frontend uses `app/` route groups:

- `app/(auth)/admin` — admin auth pages and verification.
- `app/(auth)/worker` — worker auth and verification.
- `app/(auth)/hr` — HR login and accept-invite flow.
- `app/(worker)/worker` — worker dashboard and attendance.
- `app/(admin)/admin` — admin dashboard and payroll role management.
- `app/(hr)/hr` — HR payroll review and receipts.

### Auth UI components

- `AuthLayout` — shared authentication layout.
- `LoginForm` — login form for all user types.
- `PasswordInput` / `PasswordStrength` — password entry UI.

### Hooks

- `useGps` — browser geolocation helper for check-in.
- `useDeviceFingerprint` — FingerprintJS integration.

### API layer

- `frontend/lib/api.ts` — axios clients with `/api/auth` and `/api/proxy` bases.
- `frontend/lib/auth.ts` — token storage and session helpers.
- Axios interceptor refreshes tokens on 401 and redirects to login.

### Token storage

JWTs are managed through cookies and the API proxy rather than exposing service keys in the browser.

### Real-time patterns

Components such as HR disbursement tracking use polling for status updates.

## 12. SECURITY CONSIDERATIONS

- JWTs are validated in backend dependencies, not just frontend UI.
- Service key is only used on the backend and never exposed to the frontend.
- Squad webhook signatures are validated with HMAC SHA512.
- All queries are scoped by `company_id` for tenant isolation.
- Audit logs capture every admin mutation.
- Bank changes are tracked in `bank_account_history`.
- Records are soft-deleted or logically deleted; audit trail is preserved.
