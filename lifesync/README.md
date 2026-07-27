# LifeSync — Gamified Personal Life Dashboard

LifeSync is a single-user personal productivity platform that unifies task management, goal tracking, habit tracking, expense tracking, calendar events, rich-text notes, analytics, and gamified achievements into one cohesive dashboard.

Designed with a playful, tactile, and responsive neobrutalist aesthetic, LifeSync leverages gamified XP level-ups and animated streaks to keep productivity engaging.

---

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS v3, Redux Toolkit (RTK Query), Framer Motion, Recharts
- **Backend**: Node.js + Express.js (ESM), Mongoose ODM, JWT Auth, Express Validator, Nodemailer
- **Database**: MongoDB

---

## Project Structure

```text
lifesync/
├── backend/                  # Express REST API using ES Modules
│   ├── src/
│   │   ├── config/           # DB configurations
│   │   ├── controllers/      # Route logic handlers
│   │   ├── middlewares/      # Error, Auth, and Validator middlewares
│   │   ├── models/           # Mongoose Database schemas (12 core entities)
│   │   ├── routes/           # REST endpoint router hooks
│   │   ├── utils/            # Standard response wrappers, mailers, errors
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # Port runner
│   └── package.json
│
└── frontend/                 # Vite React Client
    ├── src/
    │   ├── components/       # Design system primitives & layout containers
    │   ├── context/          # Persistent light/dark Theme provider
    │   ├── features/         # Feature folders containing UI & Redux slices
    │   │   └── auth/         # Login, Signup, profile settings, token hooks
    │   ├── store/            # Redux Toolkit global store and API cache slice
    │   ├── App.jsx           # React Router pathways
    │   └── main.jsx          # React renderer mount
    ├── index.html
    └── tailwind.config.js    # Custom typography & candy candy-colors
```

---

## Getting Started

### 1. Database Setup
Ensure you have MongoDB running locally (`mongodb://localhost:27017/lifesync`) or set up a MongoDB Atlas cloud database.

### 2. Configure Environment
1. Navigate to `/backend`
2. Duplicate `.env.example` as `.env`
3. Adjust variables (JWT secrets, SMTP details, frontend URL). If SMTP credentials are placeholders, email links will conveniently log directly to the terminal console.

### 3. Execution

#### Running the Backend:
```bash
cd backend
npm install
npm run dev
```
Runs API server on [http://localhost:5000](http://localhost:5000) (includes watch reloading).

#### Running the Frontend:
```bash
cd frontend
npm install
npm run dev
```
Launches client hot-reload server on [http://localhost:5173](http://localhost:5173).

---

## Features
- **XP / Leveling**: Visual leveling and experience bar shown at the top of the interface. Actions like completing tasks, logging habits, or hitting goals reward XP dynamically.
- **Dynamic Avatars**: Generate unique pixel-art avatars simply by randomizing or typing custom seed strings.
- **Theme Support**: Tap the Moon/Sun toggle icon to switch between off-white cream light mode and true near-black dark mode.
