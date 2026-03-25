# DBC HRIS API

Backend API for the Guard5 HRIS system, built with **Bun** runtime and **ElysiaJS** framework.

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT via `@elysiajs/jwt`
- **Docs**: Swagger UI via `@elysiajs/swagger`

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed
- PostgreSQL running (see `dbc-hris-database`)

### Local Development

```bash
bun install
cp .env.example .env
# Edit .env with your database credentials
bun run dev
```

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger

### Docker

```bash
docker-compose up -d
```

The API connects to the `dbc-hris-database_default` Docker network by default.

## Environment Variables

```env
DATABASE_URL=postgres://myuser:mypass@localhost:5432/dbc_hris
JWT_SECRET=your-secret-key-change-in-production
UPLOAD_PATH=./uploads
PORT=8080
NODE_ENV=development
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/google-login` | Login via Google (returns 404 if user not found) |
| POST | `/api/auth/google-register` | Register via Google with NIP/ID + phone |

### Employees
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees` | List all employees |
| GET | `/api/employees/:id` | Get employee by ID |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| POST | `/api/employees/import` | Bulk import employees |

### Mobile Attendance
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mobile/attendance` | Submit attendance with photo |
| GET | `/api/mobile/attendance/today` | Get today's attendance |
| GET | `/api/mobile/attendance/offline` | Get offline submissions |

### Offices
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/offices` | List all offices |
| POST | `/api/offices` | Create office |
| PUT | `/api/offices/:id` | Update office |
| DELETE | `/api/offices/:id` | Delete office |

### Admin Attendance
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/attendance` | List attendance records |
| PUT | `/api/attendance/:id/approve` | Approve attendance |
| PUT | `/api/attendance/:id/reject` | Reject attendance |

## Database Migrations

```bash
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply migrations
bun run db:studio     # Open Drizzle Studio GUI
```

Manual migration (via Docker):
```bash
docker-compose exec db psql -U myuser -d dbc_hris -f migration.sql
```

## Project Structure

```
src/
├── config/          # App configuration
├── db/
│   ├── schema.ts    # Drizzle schema (users, attendances, master_office, etc.)
│   ├── index.ts     # DB connection
│   ├── migrate.ts   # Migration runner
│   └── migrations/  # SQL migration files
├── middleware/
│   └── auth.ts      # JWT auth middleware
├── models/
│   └── index.ts     # Elysia validation schemas
├── routes/
│   ├── auth.ts      # Auth controller (login, register, google-login, google-register)
│   ├── employees.ts # Employee CRUD
│   ├── mobile.ts    # Mobile attendance endpoints
│   ├── attendance.ts # Admin attendance endpoints
│   └── offices.ts   # Office management
├── services/
│   ├── auth.service.ts         # Auth logic
│   ├── attendance.service.ts   # Attendance + QR verification
│   ├── office.service.ts       # Office logic
│   └── qr-verification.service.ts # QR code detection from photos
└── index.ts         # Entry point
```

## Scripts

```bash
bun run dev      # Dev server with hot reload
bun run start    # Production server
bun run build    # Build for production
```
