# VedQ — Student Quiz Dashboard

Production-grade MERN application for an EdTech platform: a Student Quiz Practice Dashboard supporting Maths, Physics, Chemistry, English, and Biology across classes 6–12.

> **Status:** Phases 0–6 shipped. Backend deploys to **Render**, frontend deploys to **Vercel** (deployment guide below).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  React 18 + Vite + SCSS Modules + React Router + Redux + RQuery │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS · Axios · JWT (access in mem,
                             │                refresh in httpOnly cookie)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS API SERVER                         │
│   helmet · cors · compression · morgan · rate-limit · validator │
│                                                                  │
│   Routes ──► Controllers ──► Services ──► Repositories ──► Mongoose
│                  │                │                              │
│                  └─► CacheService ◄┘  (Redis ▸ node-cache fallback)
└──────────────────┬──────────────────────────┬───────────────────┘
                   │                          │
            ┌──────▼──────┐            ┌──────▼──────┐
            │  MongoDB    │            │    Redis    │ (optional)
            └─────────────┘            └─────────────┘
```

**Layering rule:** `Route → Controller → Service → Repository → Model`. Controllers never touch Mongoose; services are pure business logic.

---

## Tech Stack

| Layer    | Tools |
|----------|-------|
| Frontend | React 18 (Vite), SCSS modules, React Router v6, Axios, Redux Toolkit, React Query, Recharts, papaparse |
| Backend  | Node.js, Express, Mongoose, JWT, bcrypt, express-validator, helmet, winston |
| Cache    | Redis (`ioredis`) with `node-cache` fallback |
| Tooling  | ESLint, Prettier, nodemon, Jest, Supertest |

---

## Local Setup

### Prerequisites
- Node.js >= 18
- npm >= 9
- MongoDB (local or Atlas) — connection string required
- Redis (optional) — falls back to in-memory cache when `REDIS_URL` is empty

### First-time install

```bash
npm run install:all
cp backend/.env.example backend/.env       # then fill MONGO_URI + JWT secrets
cp frontend/.env.example frontend/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"  # generate JWT secrets
npm run seed                                 # creates 2 admins + 10 students + question bank
npm run dev                                  # backend on :5000, frontend on :5173
```

Generated admin credentials are printed at the end of the `seed` run — copy them, they aren't shown again.

---

## Deployment Playbook

### Topology
- **Frontend** → Vercel (static React build)
- **Backend** → Render (Node web service, free tier)
- **Database** → MongoDB Atlas (free M0 cluster)
- **Cache** → Optional. If you skip Redis, the backend uses an in-memory fallback automatically.

### 1. MongoDB Atlas (5 min)
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a user, copy the password.
3. **Network Access** → add `0.0.0.0/0` (Render dynamic IPs).
4. **Connect → Drivers** → copy the SRV connection string. It will look like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/quizdash?retryWrites=true&w=majority`

### 2. Backend → Render (5 min)
This repo ships [`render.yaml`](./render.yaml) — Render reads it as a **Blueprint**.

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**.
2. Connect this GitHub repo (`PADMA190/VedQDashboard`).
3. Render reads `render.yaml` and asks for the secrets marked `sync: false`:
   - `MONGO_URI` — paste the Atlas string from step 1
   - `CLIENT_URL` — leave blank for now (we'll set it after Vercel)
   - `REDIS_URL` — leave blank (uses in-memory fallback)
4. JWT secrets auto-generate (`generateValue: true`).
5. Click **Apply**. First build takes ~3 min. Note the URL Render gives you — looks like `https://vedq-backend-xxxx.onrender.com`.

**Verify:** `curl https://<your-render-url>/api/health` should return `{"success":true,"data":{"status":"ok",...}}`.

> Render free tier sleeps after ~15 min of inactivity. The first request after sleep takes ~30–50s to wake the dyno. Keep this in mind for demos.

### 3. Frontend → Vercel (5 min)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import this GitHub repo.
3. **Important — set the Root Directory** to `frontend` (Vercel needs this to find the Vite app).
4. Framework preset: **Vite** (auto-detected). Build command, output dir, install command — all defaults work because of `frontend/vercel.json`.
5. **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-url>/api` (from step 2) |
   | `VITE_APP_NAME` | `VedQ` |
6. Click **Deploy**. First build takes ~1 min. Note the Vercel URL — looks like `https://vedq-dashboard.vercel.app`.

### 4. Wire CORS + cookies back to Render (1 min)
Render needs the Vercel URL to allow cross-site cookies and CORS:

1. Render dashboard → your service → **Environment**.
2. Set:
   | Key | Value |
   |---|---|
   | `CLIENT_URL` | `https://<your-vercel-url>` (no trailing slash) — comma-separate multiples if needed |
3. Click **Save changes** — Render redeploys automatically.

`COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` are already set by `render.yaml`, so cross-site auth cookies work out of the box.

### 5. Seed production data (optional, 1 min)
Render shell → **Shell** tab → run:
```bash
npm run seed
```
This wipes any existing data, recreates 2 admins + 10 students + the question bank, and prints the generated admin credentials in the shell output. **Save those credentials immediately** — they're not stored anywhere.

### 6. Smoke test the deployed app
Open your Vercel URL and:
1. **Sign up** as a student → see the dashboard.
2. **Log in as an admin** with the seeded credentials → verify `/admin` loads.
3. Take a quiz → submit → confirm the result page renders with explanations.

If anything 401s, the most common cause is the `CLIENT_URL` env var on Render not exactly matching the Vercel URL (case, trailing slash, or http vs https).

---

## Environment Variables (reference)

### Backend (`backend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | Set to `production` on Render |
| `PORT` | no | `5000` | Render sets `10000` automatically |
| `CLIENT_URL` | **yes (prod)** | `http://localhost:5173` | Comma-separated list of allowed origins |
| `MONGO_URI` | **yes** | — | MongoDB connection string |
| `JWT_ACCESS_SECRET` | **yes** | — | Random ≥32-char string |
| `JWT_REFRESH_SECRET` | **yes** | — | Random ≥32-char string |
| `JWT_ACCESS_TTL` | no | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | no | `7d` | Refresh token lifetime |
| `COOKIE_SECURE` | no | `false` | **`true` in prod** (HTTPS required) |
| `COOKIE_SAME_SITE` | no | `strict` | **`none` in prod** (cross-site cookies) |
| `REDIS_URL` | no | — | Empty → use node-cache fallback |
| `CACHE_TTL_*` | no | see `.env.example` | Per-resource TTLs |
| `RATE_LIMIT_*` | no | see `.env.example` | Auth + general rate limits |
| `BCRYPT_SALT_ROUNDS` | no | `10` | Bcrypt cost factor |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | **yes** | `http://localhost:5000/api` | Set to `https://<render>/api` in Vercel |
| `VITE_APP_NAME` | no | `VedQ` | Displayed in some headings |

---

## Repository Layout

```
VedQDashboard/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # env, db, logger, constants
│   │   ├── models/          # User, Quiz, Question, Attempt, TopicPerformance
│   │   ├── repositories/    # only layer that touches Mongoose
│   │   ├── services/        # business logic (caching, scoring, analytics)
│   │   ├── controllers/     # request handling
│   │   ├── routes/          # express routers
│   │   ├── middleware/      # auth, role, validate, error, rate-limit
│   │   ├── validators/      # express-validator chains
│   │   ├── utils/           # AppError, JWT, asyncWrap, scoreAttempt, withTransaction
│   │   └── scripts/seed.js  # generates admins + students + 50 questions + quizzes
│   ├── server.js
│   └── .env.example
├── frontend/                # React + Vite client
│   ├── src/
│   │   ├── api/             # axios + endpoint modules
│   │   ├── components/
│   │   │   ├── common/      # Button, Input, Select, Card, Modal, Spinner, ...
│   │   │   ├── student/     # QuizCard, Timer, QuestionNavigator, TrendChart, ...
│   │   │   └── admin/       # QuestionPickerModal, AssignmentModal
│   │   ├── pages/
│   │   │   ├── auth/        # Login, Signup
│   │   │   ├── student/     # Dashboard, QuizAttempt, AttemptResult, ...
│   │   │   └── admin/       # AdminDashboard, Quizzes, Questions, BulkImport
│   │   ├── layouts/         # AuthLayout, StudentLayout, AdminLayout
│   │   ├── routes/          # ProtectedRoute, RoleRoute, AppRoutes
│   │   ├── store/           # Redux Toolkit slices (auth, ui)
│   │   ├── hooks/           # useAuth, useQuizTimer, useDebounce, useToasts
│   │   ├── styles/          # _variables, _mixins, _typography, global
│   │   └── utils/           # format, storage
│   ├── public/sample-questions.csv  # downloadable bulk-import template
│   ├── vercel.json
│   └── .env.example
├── render.yaml              # Render blueprint
├── package.json             # root scripts + concurrently
└── README.md                # this file
```

---

## API Surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | Self-signup creates a `student` |
| POST | `/api/auth/login` | public | Sets refresh cookie, returns access token |
| POST | `/api/auth/refresh` | cookie | Single-flight refresh |
| POST | `/api/auth/logout` | — | Clears refresh cookie |
| GET | `/api/auth/me` | bearer | Current user |
| GET | `/api/quizzes` | bearer | Filters: `subject, class, search, page, limit, sort` |
| GET | `/api/quizzes/:id` | bearer | Strips correctOption/explanation for students |
| POST | `/api/attempts` | student | Server-graded; updates topic performance |
| GET | `/api/attempts/me` | bearer | Paginated history |
| GET | `/api/attempts/:id` | owner/admin | Full review with explanations |
| GET | `/api/analytics/:userId` | self/admin | Overall + subject + 30-day trend |
| GET | `/api/analytics/:userId/weak-topics` | self/admin | accuracy<60% across ≥3 attempts |
| GET | `/api/analytics/:userId/retry-quiz` | self/admin | Generates one-off retry quiz |
| GET | `/api/leaderboard` | bearer | `?subject&class&quizId&period=weekly\|monthly\|all` |
| GET | `/api/admin/dashboard-stats` | admin | Users / content / activity |
| `*` | `/api/admin/quizzes` | admin | CRUD + assign |
| `*` | `/api/admin/questions` | admin | CRUD + bulk import |
| GET | `/api/admin/users` | admin | For assignment UI |

All responses follow `{ success: true, data, message?, meta? }` or `{ success: false, error: { code, message, details? } }`.

---

## Scripts (root)

| Command | Purpose |
|---|---|
| `npm run dev` | Start backend + frontend with prefixed logs |
| `npm run dev:backend` | Backend only (nodemon) |
| `npm run dev:frontend` | Frontend only (Vite) |
| `npm run install:all` | Install root + workspace dependencies |
| `npm run seed` | Seed sample data |
| `npm run lint` | Lint backend + frontend |
| `npm run format` | Prettier write across the repo |
| `npm test` | Run backend tests |

---

## License

Proprietary — internal EdTech product.
