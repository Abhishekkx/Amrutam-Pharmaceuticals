# Amrutam Telemedicine Backend Architecture Document

## 1. System Overview

The Amrutam Telemedicine platform provides a production-grade, high-concurrency backend API for online doctor consultations, prescription management, patient scheduling, and administrative analytics.

The system is designed as a **Modular Monolith** built with Node.js (TypeScript), Express, PostgreSQL, and Redis. It targets **100,000 daily consultations**, maintaining **p95 read latency < 200ms**, **p95 write latency < 500ms**, and **99.95% availability**.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    Client[Mobile App / Web Client] --> |HTTPS / REST| ALB[Application Load Balancer]
    ALB --> NodeApp1[Node.js App Instance 1]
    ALB --> NodeApp2[Node.js App Instance 2]
    
    subgraph Modular Monolith Core
        NodeApp1 --> Controllers[Controllers Layer]
        Controllers --> Services[Business Services Layer]
        Services --> Repositories[Repositories Data Layer]
    end

    Services --> |Cache / Lock / Idempotency| Redis[(Redis Cluster)]
    Repositories --> |PostgreSQL Protocol| PostgresMaster[(PostgreSQL Primary DB)]
    PostgresMaster --> |Asynchronous Replication| PostgresReplica[(PostgreSQL Read Replica)]
```

---

## 3. Data Flow

1. **Authentication**: User submits credentials -> `AuthController` -> `AuthService` verifies BCrypt hash -> Issues signed JWT Access (1d) & Refresh (7d) tokens -> Audit log recorded.
2. **Doctor Search**: Client queries `/doctors/search` -> `DoctorService` checks Redis cache (`doctors:search:*`). On cache miss, queries indexed PostgreSQL database -> Stores result in Redis -> Returns payload.
3. **Slot Booking**: Client sends `POST /bookings` with `X-Idempotency-Key` -> `IdempotencyMiddleware` checks Redis. `BookingService` acquires Redis distributed lock (`lock:slot:{slotId}`) -> Runs atomic PostgreSQL `SELECT FOR UPDATE` transaction -> Marks slot booked & creates consultation -> Releases lock -> Emits metrics.

---

## 4. Booking Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient Client
    participant Middleware as Idempotency & Auth Middleware
    participant Service as BookingService
    participant Redis as Redis Cache & Lock
    participant DB as PostgreSQL DB
    participant Audit as AuditLog System

    Patient->>Middleware: POST /api/v1/bookings (Header: X-Idempotency-Key)
    Middleware->>Redis: GET idempotency:key
    alt Idempotency Hit
        Redis-->>Middleware: Return Cached Response
        Middleware-->>Patient: 201 Created (Cached)
    else Idempotency Miss
        Middleware->>Service: Pass Request
        Service->>Redis: SET lock:slot:{slotId} NX EX 10
        alt Lock Failed (Concurrent Request)
            Service-->>Patient: 409 Conflict (Concurrent Booking Detected)
        else Lock Acquired
            Service->>DB: BEGIN Transaction
            Service->>DB: SELECT * FROM availability_slots WHERE id = slotId FOR UPDATE
            alt Slot Already Booked
                Service->>DB: ROLLBACK
                Service->>Redis: DEL lock:slot:{slotId}
                Service-->>Patient: 409 Conflict (Slot Already Booked)
            else Slot Available
                Service->>DB: UPDATE availability_slots SET is_booked = true, version = version + 1
                Service->>DB: INSERT INTO consultations (patient_id, doctor_id, slot_id, status)
                Service->>DB: COMMIT Transaction
                Service->>Audit: Create AuditLog Entry
                Service->>Redis: DEL lock:slot:{slotId}
                Service->>Redis: SET idempotency:key (Response Payload)
                Service-->>Patient: 201 Created (Consultation Object)
            end
        end
    end
```

---

## 5. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o| profiles : "has"
    users ||--o| doctors : "has"
    users ||--o{ consultations : "books"
    users ||--o{ payments : "makes"
    users ||--o{ audit_logs : "triggers"
    doctors ||--o{ availability_slots : "manages"
    doctors ||--o{ consultations : "conducts"
    doctors ||--o{ prescriptions : "issues"
    availability_slots ||--o| consultations : "reserves"
    consultations ||--o| prescriptions : "generates"
    consultations ||--o| payments : "settles"

    users {
        uuid id PK
        string email UK
        string password_hash
        string role
        boolean mfa_enabled
        timestamp created_at
    }

    doctors {
        uuid id PK
        uuid user_id FK
        string specialty
        int experience_years
        float consultation_fee
        float rating
    }

    availability_slots {
        uuid id PK
        uuid doctor_id FK
        timestamp start_time
        timestamp end_time
        boolean is_booked
        int version
    }

    consultations {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        uuid slot_id FK
        string status
        timestamp created_at
    }

    prescriptions {
        uuid id PK
        uuid consultation_id FK
        uuid doctor_id FK
        uuid patient_id FK
        json medications
        string digital_signature
    }

    payments {
        uuid id PK
        uuid consultation_id FK
        uuid user_id FK
        float amount
        string status
        string transaction_ref UK
        string idempotency_key UK
    }
```

---

## 6. Concurrency & Double Booking Prevention Strategy

Double booking is prevented through a multi-tiered protection architecture:

1. **Redis Distributed Locks**: Requests targeting a specific `slot_id` must acquire `lock:slot:{slot_id}` via atomic `SET ... NX EX 10`. If another thread holds the lock, immediate 409 Conflict is returned.
2. **PostgreSQL Explicit Row Locking (`SELECT FOR UPDATE`)**: Transactions lock the target slot row during validation.
3. **Database Unique Constraints**: `availability_slots` enforces a `UNIQUE(doctor_id, start_time)` index constraint. `consultations` enforces a `UNIQUE(slot_id)` foreign key constraint.
4. **Optimistic Locking / Versioning**: Updates specify `WHERE id = slot_id AND is_booked = false AND version = current_version`.

---

## 7. Idempotency Strategy

- Write requests accept an optional `X-Idempotency-Key` header.
- `IdempotencyMiddleware` stores execution state in Redis under `idempotency:{key}`:
  - Phase 1: Sets value `PROCESSING` (TTL 60s). Concurrent duplicate requests receive `409 Conflict`.
  - Phase 2: Upon successful route handler completion, caches status code and JSON payload for 24 hours.
  - Phase 3: Retried requests receive exact cached response without re-executing business logic.

---

## 8. Backup & Disaster Recovery (DR) Strategy

- **RPO (Recovery Point Objective)**: < 5 minutes (WAL archiving with AWS Aurora PostgreSQL).
- **RTO (Recovery Time Objective)**: < 15 minutes (Automated failover across Multi-AZ deployment).
- **Backups**: Daily automated full snapshot retained for 30 days; continuous point-in-time recovery (PITR).
- **Redis DR**: Redis configured with RDB snapshots every 15 minutes + AOF appendonly enabled. In case of cold restart, application uses in-memory fallback gracefully without failing requests.
