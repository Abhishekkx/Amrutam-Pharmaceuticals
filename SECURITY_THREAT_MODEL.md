# Amrutam Telemedicine Security & Threat Model Document

## 1. Attack Surface Analysis

The primary attack surface of the Amrutam Telemedicine Backend comprises:
- Public HTTP REST API Endpoints (`/api/v1/auth/*`, `/api/v1/doctors/search`)
- Authenticated Patient/Doctor/Admin API Endpoints (`/api/v1/bookings`, `/api/v1/prescriptions`, `/api/v1/analytics`)
- Database (PostgreSQL 5432) and Cache (Redis 6379) Connection Boundaries
- Environment Variables & Secret Configuration Keys

---

## 2. Data Classification Matrix

| Data Category | Examples | Sensitivity Level | Controls Applied |
| :--- | :--- | :--- | :--- |
| **Authentication Secrets** | Password Hashes, JWT Secrets, MFA Secrets | **CRITICAL** | Bcrypt (10 rounds), Environment Variable Secrets, Zero plain text storage |
| **Protected Health Info (PHI)** | Prescriptions, Doctor Notes, Diagnosis | **HIGH** | Role-Based Access Control (RBAC), Digital SHA-256 Signature, TLS 1.3 |
| **Personally Identifiable Info (PII)** | Email, Full Name, Phone | **HIGH** | Input sanitization, encrypted transport, parameterized queries |
| **Financial / Payment Data** | Transaction Reference, Amount | **HIGH** | Mock Payment Gateway Integration, Idempotency tracking |
| **System / Operational Logs** | Metrics, Audit Logs, Correlation IDs | **MEDIUM** | Masked user credentials, Structured JSON logging |

---

## 3. OWASP Top 10 Mitigations Matrix

### A01: Broken Access Control
- **Mitigation**: Strict Role-Based Access Control (RBAC) middleware (`Role.PATIENT`, `Role.DOCTOR`, `Role.ADMIN`). Patients cannot access other patients' consultations or issue prescriptions.

### A02: Cryptographic Failures
- **Mitigation**: Passwords hashed with BCrypt (salt factor 10). JWT tokens signed with strong secrets. Communication forced over TLS 1.3 in production. Digital SHA-256 signatures generated for prescriptions.

### A03: Injection (SQL / NoSQL / Command)
- **Mitigation**: All database queries executed through Prisma ORM using parameterized SQL. Zod schema validation blocks malformed query string/body payloads before database interaction.

### A04: Insecure Design
- **Mitigation**: Idempotency middleware prevents duplicate financial/booking operations. Redis distributed locks prevent double booking under high-concurrency race conditions.

### A05: Security Misconfiguration
- **Mitigation**: Security headers enabled via `helmet()` (HSTS, CSP, X-Content-Type-Options). Error responses omit stack traces and internal database schema details in production.

### A07: Identification and Authentication Failures
- **Mitigation**: Account lockout / rate limiting enforced on `/auth/login`. JWT access tokens have 1-day expiration; refresh tokens have 7-day expiration.

---

## 4. Key Rotation Procedure

1. **JWT Secret Rotation**: Update `JWT_SECRET` in secret manager. Previous tokens invalidated gracefully via short 1-day expiration window.
2. **Database Credentials**: Managed via AWS Secrets Manager with 90-day automatic rotation.
3. **Environment Isolation**: Production secrets injection enforced via container env vars; no secrets committed to version control.

---

## 5. Audit Logging Compliance

All security and compliance sensitive actions generate a permanent `AuditLog` entry in PostgreSQL including:
- `actorId` (User UUID)
- `action` (`USER_LOGIN_SUCCESS`, `AUTH_FAILED`, `CONSULTATION_BOOKED`, `PRESCRIPTION_CREATED`, etc.)
- `correlationId` (HTTP request tracing ID)
- `ipAddress` & `timestamp`
