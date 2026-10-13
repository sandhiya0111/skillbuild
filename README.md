# Sahaaya — Real-Time Community Assistance & Rehabilitation Platform

A full-stack MERN starter project that connects community members, volunteers, NGOs, shelters and administrators to coordinate essential assistance and rehabilitation opportunities.

## Key features

- React + Vite responsive dashboard and user experience
- JWT registration/login with bcrypt password hashing
- Roles: citizen, volunteer, NGO and admin
- Real-time non-sensitive update notifications using Socket.IO
- Create and track assistance requests for food, clothing, shelter, medical care, rehabilitation and employment
- Request urgency, status, assignment, and internal activity comments
- NGO/shelter directory with admin verification workflow and capacity details
- Role-aware request lists and protected backend routes
- Dashboard statistics
- Seed script for a demo administrator
- Environment-variable configuration and basic security middleware

## Requirements

- Node.js 18 or newer
- MongoDB local install or MongoDB Atlas database
- npm

## Setup

### 1. Configure the API

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.

Install dependencies:

```bash
npm install
```

Optional: create a demo administrator (credentials are set in your `.env`):

```bash
npm run seed:admin
```

Start the API:

```bash
npm run dev
```

API default: `http://localhost:5000`

### 2. Configure the frontend

In another terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Vite default: `http://localhost:5173`

### 3. Sign in and demo workflow

1. Register a citizen or volunteer account from the UI.
2. Create an assistance request.
3. Register an account with role **NGO** and submit an organization profile from the Directory page.
4. Sign in as the seeded admin and approve the NGO from the Admin section.
5. A verified NGO or volunteer can then claim/assign an open request and update its status.

The seeded admin uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `server/.env`. Change the example password before use. If you don't run the seed command, register a normal account to explore citizen workflows.

## API overview

- `GET /api/health` — server/database status
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard` — role-aware dashboard metrics
- `GET /api/requests`, `POST /api/requests`, `GET /api/requests/:id`
- `PATCH /api/requests/:id/assign`, `PATCH /api/requests/:id/status`
- `POST /api/requests/:id/comments`
- `GET /api/organizations`, `GET /api/organizations/mine`, `POST /api/organizations`
- `PATCH /api/organizations/:id` — owner edits their organization; admin can verify it

## Privacy and safety

This is a learning/demo project, not a certified case-management or emergency-response system. Do not use it to publicly expose people's exact locations, health information, identity documents or other sensitive personal details. Use general locations, get consent, and restrict access to case details. It is not an emergency service. For production, add rate limiting, email verification, audit logging, data-retention rules, backups, stronger moderation, monitoring, and a formal privacy/security review.

Socket.IO broadcasts only generic change signals (event type, record ID and time); clients refetch permitted data through authenticated REST endpoints. It does not broadcast request descriptions or exact locations.

## Structure

```text
community-assistance-mern/
├── client/                 # React + Vite
└── server/                 # Express API + MongoDB
    └── src/
        ├── middleware/     # JWT authentication / role guard
        ├── models/         # Mongoose schemas
        ├── routes/         # REST endpoints
        └── scripts/        # demo admin seeding
```
