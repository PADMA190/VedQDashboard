# 🎓 VedQ — Student Quiz Dashboard

A Platfrom where student can practice assigned quizzes and review weak points and retake quiz.
---

## ✨ Features

- 🔐 **Role-based authentication** — separate Admin & Student experiences
- 📝 **Quiz assignment & attempts** — admins assign quizzes; students attempt them with a paginated, single-question UI
- 📊 **Analytics dashboard** — accuracy trends, subject breakdowns, and performance summaries
- 🏆 **Leaderboard** — top performers filterable by subject, class, and time period
- 🎯 **Weak topic analysis** — auto-detects topics where accuracy falls below 60%
- 🔁 **Retry quiz generation** — focused practice quizzes built from your weak topics
- ⬆️ **Bulk question import** — CSV upload to seed the question bank fast
- 📱 **Responsive UI** — works on mobile, tablet, and desktop
- 🛡️ **JWT authentication** — access token in memory, refresh token in `httpOnly` cookie
- 🚧 **Protected routes** — role-aware route guards on every page

---

## 🧰 Tech Stack

**Frontend** — React 18 · Vite · SCSS Modules · Redux Toolkit · React Query · React Router v6 · Recharts
**Backend** — Node.js · Express · MongoDB (Mongoose) · JWT · bcrypt · Helmet · Winston
**Cache** — Redis (`ioredis`) with `node-cache` fallback
**Tooling** — ESLint · Prettier · Jest · nodemon

---

## 🚀 Project Setup (Local)

```bash
# Clone and install
git clone https://github.com/PADMA190/VedQDashboard.git
cd VedQDashboard
npm run install:all

# Configure environment
cp backend/.env.example backend/.env       # set MONGO_URI + JWT secrets
cp frontend/.env.example frontend/.env

# Seed sample data + start dev server
npm run seed
npm run dev
```

App → `http://localhost:5173` · API → `http://localhost:5000`

---

## 🌐 Deployment Links

| Service | URL |
|---|---|
| 🌍 Live App | https://ved-q-dashboard.vercel.app |

---

## 🔑 Demo Credentials

### 👨‍💼 Admin Login
- **Email:** `admin1@quizdash.local`
- **Password:** `AWnZU6rVSPjdHQA1z`

### 👨‍🎓 Student Login
- **Email:** `padmalatchi@gmail.com`
- **Password:** `Padma@190`

> ⚠️ **Note:** Newly registered students may not see quizzes initially because quizzes are assigned by admins. Use the demo student account to review assigned quizzes and dashboard functionality.

---

## 📁 Project Structure

```
VedQDashboard/
├── backend/              # Express API
│   ├── src/
│   │   ├── config/       # env, db, logger
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic + cache
│   │   ├── repositories/ # DB access layer
│   │   └── scripts/      # Seed script
│   └── server.js
├── frontend/             # React + Vite client
│   ├── src/
│   │   ├── api/          # Axios endpoints
│   │   ├── components/   # common · student · admin
│   │   ├── pages/        # auth · student · admin
│   │   ├── layouts/      # Auth · Student · Admin
│   │   ├── store/        # Redux Toolkit slices
│   │   ├── hooks/        # useAuth, useQuizTimer, …
│   │   └── styles/       # SCSS design system
│   └── vercel.json
├── render.yaml           # Backend deployment config
└── README.md
```

---

## 🔌 API Overview

| Group | Purpose |
|---|---|
| **Auth** | Register, login, refresh, logout, current user |
| **Quizzes** | List + detail (answer-stripped for students) |
| **Attempts** | Submit (server-graded), my history, attempt review |
| **Analytics** | Overall stats, weak topics, retry-quiz generator |
| **Leaderboard** | Top performers, filterable by subject / class / period |
| **Admin** | Quiz CRUD, question CRUD + bulk import, assignments, dashboard stats |

All responses follow the shape `{ success, data, message?, meta? }`.

---

