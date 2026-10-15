# WellNest Backend — Python Migration Guide

## Current Stack
Node.js + Express

## Target Stack
Python + FastAPI

---

## Why Python?
- Google Gemini has an official Python SDK (`google-generativeai`)
- FastAPI is modern, fast, and async
- Email via Python's built-in `smtplib` — no extra packages
- Better for AI/ML integration in future
- Industry standard for AI backends

---

## Python Dependencies Required

Install these:

```bash
pip install fastapi uvicorn python-dotenv google-generativeai Pillow requests smtplib2
```

Or use requirements.txt:

```
fastapi==0.115.0
uvicorn==0.30.0
python-dotenv==1.0.0
google-generativeai==0.8.0
Pillow==10.4.0
requests==2.32.0
python-multipart==0.0.9
```

---

## API Endpoints (same as Node version)

```
GET  /api/health
POST /api/vision/describe   → surroundings description
POST /api/vision/capture    → one-shot capture + Q&A
POST /api/vision/grocery    → product label scan
POST /api/vision/question   → follow-up question
POST /api/sos/email         → SOS emergency email
```

---

## Python FastAPI Server Structure

```
backend/
├── main.py              ← FastAPI app (replaces server.js)
├── .env                 ← API keys (same as now)
├── requirements.txt     ← Python dependencies
└── services/
    ├── gemini.py        ← Gemini Vision API calls
    └── email_service.py ← SOS email sending
```

---

## How to Run Python Backend

```bash
# Install Python 3.11+
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 3001
```

---

## .env stays the same

```
GEMINI_API_KEY=your_key_here
PORT=3001
GUARDIAN_EMAIL=chaudharypriya9313@gmail.com
SENDER_EMAIL=your_gmail@gmail.com
SENDER_APP_PASSWORD=your_app_password
```

---

## Migration Steps

1. Create `main.py` with FastAPI
2. Create `services/gemini.py` using `google-generativeai` SDK
3. Create `services/email_service.py` using `smtplib`
4. Test all endpoints
5. Delete `server.js`, `package.json`
6. Frontend stays exactly the same — no changes needed

---

## Note
Frontend (React) does NOT need any changes.
It just calls the same API endpoints.
Only the backend language changes from Node.js to Python.
