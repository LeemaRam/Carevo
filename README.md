# Carevo — Job Tracker Web Application

> **Track your job applications. Take control of your career.**

A full-stack job tracking application that helps users manage, organize, and analyze their job applications with a modern dashboard and real-time insights.
Built with React, Node.js, Express, and MongoDB. Carevo helps you stay on top of every application — from the first "Applied" to the final "Offer".

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-19-61DAFB.svg)

---
<h2 align="center">🚀 Project Demo</h2>

<p align="center">
  <img src="./Carevo.gif" alt="Demo" width="800"/>
</p>

<p align="center">
  <a href="https://your-live-site.com">🌐 Live Demo</a> •
  <a href="https://github.com/your-repo">📂 Source Code</a>
</p>
---

## ✨ Features

### 🔐 Authentication
- Secure **JWT-based** signup/login
- Passwords hashed with **bcryptjs** (10 salt rounds)
- Protected routes — dashboard only accessible after login

### 📋 Job Management
- Add, edit, and delete job applications
- Track: **Company**, **Job Title**, **Status**, **Application Date**, **Notes**, **Job Link**
- Status values: `Applied` · `Interview` · `Offer` · `Rejected`

### 📊 Dashboard & Analytics
- Live stats: Total / Applied / Interview / Offer / Rejected
- **Pie chart** — status distribution
- **Bar chart** — monthly application volume
- Recent applications preview

### 🔍 Search & Filter
- Search by company name or job title
- Filter by status
- Sort by date (newest / oldest first)

### 🎨 UI/UX
- Clean, modern SaaS-inspired design
- **Dark / Light mode** toggle (persisted to `localStorage`)
- Fully **responsive** — mobile & desktop
- **Sidebar navigation** with collapsible mobile drawer
- Skeleton loaders & empty states
- Toast notifications

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Charts | Recharts |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| HTTP client | Axios |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## 📁 Project Structure

```
carevo/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── JobCard.jsx
│   │   │   ├── JobForm.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # JWT auth state
│   │   │   └── ThemeContext.jsx # Dark/light mode
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Jobs.jsx
│   │   └── App.jsx
│   └── vite.config.js
│
└── server/                  # Node.js + Express backend
    ├── models/
    │   ├── User.js
    │   └── Job.js
    ├── routes/
    │   ├── auth.js          # POST /api/auth/register, /login
    │   └── jobs.js          # GET/POST/PUT/DELETE /api/jobs
    ├── middleware/
    │   └── auth.js          # JWT verification
    └── index.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 1. Clone the repository
```bash
git clone https://github.com/LeemaRam/Carevo.git
cd Carevo
```

### 2. Set up the backend
```bash
cd server
cp .env.example .env
# Edit .env and set your MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

### 3. Set up the frontend
```bash
cd ../client
cp .env.example .env
npm install
npm run dev
```

The app will be available at **http://localhost:5173** (proxied to the Express server on port 5000).

---

## 🌍 Deployment

| Service | Target |
|---|---|
| **Frontend** | [Vercel](https://vercel.com) — import the `client` folder |
| **Backend** | [Render](https://render.com) / [Railway](https://railway.app) — deploy the `server` folder |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |

### Environment Variables

**Server (`server/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/carevo
JWT_SECRET=your_very_strong_secret
NODE_ENV=production
```

**Client (`client/.env`):**
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Log in, receive JWT |

### Jobs (all protected — `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all jobs (filter/search/sort) |
| `GET` | `/api/jobs/stats` | Dashboard statistics |
| `POST` | `/api/jobs` | Add a job application |
| `PUT` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job |

---

## 🔐 Security
- Passwords hashed with bcryptjs (never stored in plaintext)
- JWT stored in `localStorage`, sent via `Authorization` header
- Ownership check on every PUT/DELETE operation
- Input validation with `express-validator`
- Environment variables for all secrets

---

## 💼 Resume Bullet Point

> **Carevo — Full-Stack Job Tracker** | React · Node.js · MongoDB · JWT
> Engineered a production-ready job application tracker featuring JWT authentication, MongoDB-backed CRUD with ownership enforcement, Recharts data visualizations (pie & bar charts), real-time search/filter/sort, and a responsive dark/light UI — deployed on Vercel (frontend) and Render (backend).

---

## 📄 License

MIT © [LeemaRam](https://github.com/LeemaRam)

