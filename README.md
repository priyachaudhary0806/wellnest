# WellNest - AI Accessibility Companion

## Structure
```
well_nestB/
├── backend/    → Node.js + Express server (Gemini API proxy)
└── frontend/   → React app (Vite)
```

## How to Run

### Terminal 1 — Start Backend
```
cd backend
node server.js
```
Backend runs at: http://localhost:3001

### Terminal 2 — Start Frontend
```
cd frontend
npm run dev
```
App opens at: http://localhost:5173

## Setup (first time only)
1. Add Gemini API key in `backend/.env`
2. Run `npm install` in both `backend/` and `frontend/`
