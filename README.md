# Pitch Perfect — Sports Venue & Turf Booking Platform

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)

> **Course**: SECT-4221 Enterprise Application Development — Group Capstone Project (Spring 2025/2026)
> **Institution**: Addis Ababa University of Technology — Department of Software Engineering
> **Group Project ID**: GP-2026-XXXX 

---

## Project Overview

**Pitch Perfect** is a production-quality, full-stack enterprise web application that digitizes the complete lifecycle of booking and managing local sports turfs and futsal pitches in Addis Ababa. Local teams and individuals frequently struggle to secure available venues due to fragmented, manual systems that rely on phone calls or physical site visits. Venue managers on the other side face compounding operational issues — double bookings, unrecorded cancellations, and inefficient peak-hour slot management.

This platform resolves both sides of the problem by providing real-time availability tracking, automated pricing calculation, a conflict-free booking engine enforced at the database level, a structured cancellation and refund workflow, and a secure role-based access infrastructure that spans three distinct user roles.

---

## Repository Structure

This repository is organized as a monorepo containing two independently runnable sub-projects:

```
enterprise-final-assignment/
├── PitchPerfect/                  # Spring Boot 3.2.5 REST API (Java 21)
│   ├── src/main/java/             # Application source (controller, service, repository, model, dto, security, config)
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/          # 16 versioned Flyway migration scripts (V1 → V16)
│   ├── src/test/java/             # JUnit 5 + Mockito test suites (BookingServiceTest, PitchServiceTest, PitchControllerTest)
│   ├── Dockerfile                 # Spring Boot container (eclipse-temurin:21-jdk-alpine)
│   ├── docker-compose.yml         # Full stack: PostgreSQL 15 + Spring Boot API + React frontend
│   └── pom.xml                    # Maven build descriptor (Spring Boot 3.2.5, JaCoCo, JJWT 0.12.6, springdoc 2.5.0)
│
└── PitchPerfect/pitch-perfect-ui/ # React 19 + Vite 8 + Tailwind CSS 3 frontend
    ├── src/
    │   ├── pages/                 # Home, Auth, Dashboard, ManagerDashboard, AdminDashboard, MyBookings, Profile
    │   ├── components/            # Navbar, ConfirmModal, ImageCropper
    │   ├── context/               # AuthContext (JWT state, role-aware routing)
    │   ├── config.js              # Central API base URL (reads VITE_API_URL env var)
    │   ├── api/                   # Axios client configuration
    │   └── services/              # Service modules per domain
    ├── Dockerfile                 # Multi-stage: Node/Vite build → Nginx serve (no Node at runtime)
    ├── package.json               # React 19, React Router 7, Axios, Lucide React, Tailwind CSS
    └── vite.config.js
```

---

## Group Members & Work Plan

| # | Full Name | Student ID | GitHub | Core Responsibility |
|:--|:----------|:-----------|:-------|:--------------------|
| **1** | **Abel Taye** *(Leader)* | ATE/3156/14 | @abeldevs1 | Database schema & Flyway migrations (V1–V15); JPA entity relationships; Spring Security 6 + JWT pipeline; React frontend (pitch-perfect-ui) |
| **2** | **Befiker Gezahegn** | ATE/6972/14 | @BefikerG | Repository & service layer skeleton; REST controllers; immutable DTO record design |
| **3** | **Mihret Girum** | ATE/1607/14 | @MHreall | Docker Compose orchestration & production deployment; automated test suite collaborator |
| **4** | **Yosef Ahmedin** | ATE/2719/14 | @Yosefah48 | PDF reporting & technical documentation; automated test suite collaborator |

---

## The 5 Architectural Pillars

In strict compliance with the SE4801 project guidelines, the system implements five core enterprise pillars:

1. **Backend API** — Spring Boot 3.2.5 on Java 21. Clean REST semantics across six controller classes (`AuthController`, `PitchController`, `BookingController`, `ReviewController`, `UserController`, `AdminController`), structured JSON global error responses via `GlobalExceptionHandler`, and offset-based pagination on all list resources.

2. **Data Layer** — Normalized PostgreSQL 15 schema. All schema state transitions are managed exclusively through 15 versioned Flyway evolutionary migration scripts (`V1__init_schema` through `V15__add_cancellation_refund_fields`). Hibernate is set to `validate` mode — it never mutates the schema.

3. **Security Pipeline** — Spring Security 6 with a stateless JWT filter chain (`JwtAuthFilter`, `JwtUtil`, `CustomUserDetailsService`). BCrypt password encoding and method-level RBAC via `@PreAuthorize`. Zero secrets in source — all credentials and keys are injected through environment variables.

4. **Quality Assurance** — JUnit 5 test suites covering `BookingService`, `PitchService`, and `PitchController`. Mockito is used for service-layer isolation. JaCoCo is configured as a Maven plugin to enforce the mandatory 70% line coverage threshold. Reports are produced at `target/site/jacoco/index.html` on every `mvn test` run.

5. **Deployment Infrastructure** — A `docker-compose.yml` orchestrates three containers: `pitch_perfect_db` (PostgreSQL 15), `pitch_perfect_api` (Spring Boot on port 8081), and `pitch_perfect_ui` (React served by Nginx on port 3000). The entire full stack — database, backend, and frontend — can be launched with a single command. The React frontend is packaged into a lightweight Nginx container using a multi-stage Docker build; no Node.js installation is required to run the UI.

---

## Domain Architecture

The application enforces a strict four-layer decoupled architecture: **Controller → Service → Repository → Entity**.

### Architecture Rules

- **Separation of Concerns** — Controllers are pure HTTP presentation layers. They never call repositories directly.
- **DTO Encapsulation** — All inbound request payloads and outbound API responses use immutable Java record DTOs located in `dto/request/` and `dto/response/`. Domain `@Entity` objects never cross service boundaries.
- **Zero Hardcoded Secrets** — No plain-text passwords, JWT keys, or database credentials exist in any source file. All runtime secrets are injected via environment variables resolved in `application.properties`.
- **Conflict-Free Scheduling** — Booking conflicts are prevented at multiple layers: service-level overlap detection, a database-level unique index on the booking time range (`V10__add_booking_unique_index.sql`), and `@Future` Bean Validation constraints on incoming request timestamps.

### Core Domain Entities

| Entity | Description | Key Relationships |
|:-------|:------------|:------------------|
| `User` | System actors with roles: `ADMIN`, `MANAGER`, `CUSTOMER`. Stores unique email, BCrypt-encoded password hash, and optional profile fields added in V12. | 1:N Bookings, 1:N Reviews |
| `Pitch` | Physical futsal or football turf with location, hourly rate, availability flag, manager assignment (V6), and image URL array (V7). | M:1 Manager (User), 1:N Bookings, 1:N Reviews |
| `Booking` | Central transaction entity. Links a Customer to a Pitch with a distinct `startTime`/`endTime` pair, a status enum, and a cancellation reason field (V4). Includes refund-tracking fields added in V15. | M:1 User, M:1 Pitch, 1:1 Payment |
| `Review` | Integer rating and comment authored by a Customer for a specific Pitch. | M:1 User, M:1 Pitch |
| `Payment` | Stores transaction amount, method, and timestamp. Maintained in a strict 1:1 relationship with its corresponding Booking. | 1:1 Booking |

---

## Frontend — pitch-perfect-ui

The React 19 frontend is a single-page application built with Vite 8 and styled with Tailwind CSS 3. It communicates exclusively with the Spring Boot backend via Axios.

### Technology Stack

| Technology | Version | Purpose |
|:-----------|:--------|:--------|
| React | 19 | Component-based UI framework |
| Vite | 8 | Build tooling and dev server |
| React Router | 7 | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first styling |
| Axios | 1.x | HTTP client for API communication |
| Lucide React | 1.x | Icon library |

### Pages & Routes

| Route | Component | Access |
|:------|:----------|:-------|
| `/` | `Home` | Public — pitch discovery and search |
| `/auth` | `Auth` | Public — login and registration |
| `/dashboard` | `Dashboard` | CUSTOMER — browse and book pitches |
| `/my-bookings` | `MyBookings` | CUSTOMER — booking history, cancellations, refund policy |
| `/manager` | `ManagerDashboard` | MANAGER — pitch management, booking approval workflow |
| `/admin` | `AdminDashboard` | ADMIN — global platform controls, user management |
| `/profile` | `Profile` | Authenticated — account settings |

### Running the Frontend

```bash
cd PitchPerfect/pitch-perfect-ui

# Install dependencies
npm install

# Start the Vite development server (proxies API calls to localhost:8081)
npm run dev
```

The UI development server starts at `http://localhost:5173`.

---

## Security Design & Role-Permission Matrix

The request pipeline passes through `JwtAuthFilter`, which decodes and validates incoming Bearer tokens, populates the `SecurityContext`, and delegates method-level authorization to `@PreAuthorize` annotations.

| Endpoint Pattern | Method | Auth Required | Minimum Role | Operation |
|:-----------------|:-------|:-------------|:-------------|:----------|
| `/api/auth/register` | POST | No | PUBLIC | User registration |
| `/api/auth/login` | POST | No | PUBLIC | Credential validation and JWT issuance |
| `/api/pitches/**` | GET | No | PUBLIC | Paginated pitch search and filtering |
| `/api/bookings` | POST | Yes | CUSTOMER | Request a booking slot |
| `/api/reviews` | POST | Yes | CUSTOMER | Submit a pitch review |
| `/api/pitches/**` | POST / PUT | Yes | MANAGER | Create and update pitch listings |
| `/api/admin/**` | ALL | Yes | ADMIN | Global platform administration |

### OWASP API Security Mitigations

- **Broken Object Level Authorization (BOLA)** — Every service method validates the authenticated principal's identity against the resource owner before returning data or mutating state. A customer cannot access another customer's bookings; a manager cannot modify pitches they do not own.
- **Input Validation** — All controller request bodies are annotated with `@Valid`. Fields are guarded by `@NotBlank`, `@Size`, `@Email`, and temporal constraints (`@Future` on booking start times) via Spring's Bean Validation framework.

---

## 🐳 Docker — Full Stack Setup (Recommended)

The easiest way to run the entire application. No need to install Java, Node.js, or Vite — Docker handles everything.

### Prerequisites

- [Docker Engine](https://docs.docker.com/get-docker/) with Docker Compose
- [Apache Maven 3.9+](https://maven.apache.org/) (only needed to build the JAR once)

### Step 1 — Build the Backend JAR

```bash
cd PitchPerfect
mvn clean package -DskipTests
```

This compiles the Spring Boot application and produces `target/PitchPerfect-*.jar`.

### Step 2 — Start All Services

```bash
docker compose up --build
```

Docker will automatically:
1. Start **PostgreSQL 15** (`pitch_perfect_db`) on port `5432`
2. Start the **Spring Boot API** (`pitch_perfect_api`) on port `8081` — Flyway migrations run on startup
3. Build and start the **React frontend** (`pitch_perfect_ui`) using a multi-stage Nginx image on port `3000`

### Access Points

| Service | URL |
|:--------|:----|
| **Frontend** (React/Nginx) | `http://localhost:3000` |
| **Backend API** (Spring Boot) | `http://localhost:8081` |
| **API Docs** (Swagger UI) | `http://localhost:8081/swagger-ui.html` |
| **Database** (PostgreSQL) | `localhost:5432` |

### Stop All Services

```bash
docker compose down
```

### Rebuild After Code Changes

```bash
# If you changed backend Java code:
mvn clean package -DskipTests
docker compose up --build app

# If you changed frontend React code:
docker compose up --build frontend
```

> **Note on `VITE_API_URL`**: The frontend is built with `VITE_API_URL=http://localhost:8081` baked in at Docker build time. If you deploy to a remote server, update the `args.VITE_API_URL` value in `docker-compose.yml` to point to your server's public IP or domain before running `docker compose up --build frontend`.

---

## Local Development Setup (Without Docker)

### Prerequisites

- Java Development Kit (JDK) 21
- Apache Maven 3.9+
- Docker Engine with Docker Compose
- Node.js 20+ and npm (for the frontend)

### 1. Environment Configuration

Create a `.env` file at the root of the `PitchPerfect/` directory. The `application.properties` file reads these values at startup:

```env
# Required — override in production
DB_URL=jdbc:postgresql://localhost:5432/pitch_perfect
DB_USER=root
DB_PASS=rootpassword
JWT_SECRET=your-cryptographically-secure-256-bit-key-string-here
SPRING_PROFILES_ACTIVE=dev
```

> **Note**: The `application.properties` in this repository contains default development values for local convenience. In any production or staging environment, all secrets must be supplied exclusively through environment variables and must never be committed to version control.

### 2. Start the Database Container

```bash
cd PitchPerfect
docker-compose up db -d
```

This starts a PostgreSQL 15 instance at `localhost:5432` with database name `pitch_perfect`.

### 3. Start the Spring Boot Backend

```bash
# From the PitchPerfect/ directory
mvn spring-boot:run
```

The API server starts on `http://localhost:8081`. Flyway automatically applies all 15 migration scripts in sequence on first run.

### 4. Start the React Frontend

```bash
cd pitch-perfect-ui
npm install
npm run dev
```

The UI starts on `http://localhost:5173`.

---

## Automated Testing

The test suite covers service-layer business logic and controller endpoint behavior.

```bash
# From the PitchPerfect/ directory
mvn clean test
```

**Test classes included:**

- `BookingServiceTest` — Unit tests for the conflict detection, cancellation, and refund calculation logic in `BookingService`.
- `PitchServiceTest` — Unit tests for pitch creation, availability toggling, and ownership validation in `PitchService`.
- `PitchControllerTest` — Controller slice tests verifying HTTP response codes and security constraints on pitch endpoints.

### JaCoCo Coverage Report

After the test run completes, open the coverage report to verify compliance with the mandatory 70% line coverage threshold:

```
PitchPerfect/target/site/jacoco/index.html
```

---

## API Documentation

When the backend is running locally, the full interactive OpenAPI documentation is available at:

```
http://localhost:8081/swagger-ui.html
```

This interface is generated automatically by `springdoc-openapi 2.5.0` and reflects all live endpoint schemas, request bodies, response structures, and security requirements.

---

## Database Migration History

All schema changes are tracked as versioned Flyway scripts. No manual DDL is ever applied to the database outside of this migration chain.

| Version | Description |
|:--------|:------------|
| V1 | Initial schema — `users`, `pitches`, `bookings` tables |
| V2 | `reviews` and `payments` tables |
| V3 | Seed admin account |
| V4 | `cancellation_reason` column on bookings |
| V5 | Operational indexes for query performance |
| V6 | Manager assignment and image column on pitches |
| V7 | Image URL array column on pitches |
| V8 | Admin password reset utility |
| V9 | Remove test pitch seed data |
| V10 | Unique index on booking time ranges (conflict enforcement) |
| V11 | `is_banned` column on users |
| V12 | User profile fields (phone, bio, avatar) |
| V13 | `created_by` audit column on pitches |
| V14 | Unique constraint on username |
| V15 | Cancellation refund tracking fields |
| V16 | Widen `image_url` column from `VARCHAR(255)` to `TEXT` to support base64-encoded uploaded images |

---

## AI Tool Disclosure

In alignment with the academic integrity frameworks defined in Sections A12 and C6 of the project guidelines, the development team declares that generative AI tools were used during development. Their use was limited to boilerplate code generation (configuring Lombok field annotations, initial repository skeleton scaffolding),helped with debugging some persistant bugs  and standard Markdown layout assistance. All core domain logic — including the conflict-free scheduling engine, the cancellation and refund workflow, the JWT security filter chain, and the role-based authorization rules — was written, reviewed, and tested by the assigned group members.
