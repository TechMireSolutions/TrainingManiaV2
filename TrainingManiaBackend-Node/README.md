# Training Mania - Node.js Backend

A drop-in replacement backend for the **Training Mania** platform built with **Node.js, Express.js, Prisma ORM, and Google Generative AI (Gemini 2.0 Flash)**.

---

## 🚀 Features

- **100% Contract & Route Parity**: Matches every single route, HTTP method, query parameter, header (`X-Admin-ID`), and JSON response shape from the previous Django backend.
- **Prisma ORM**: Type-safe schema with SQLite for local development (`file:./dev.db`), seamlessly upgradeable to PostgreSQL or MySQL.
- **File Uploads**: Handles PDF manuals, training video files, thumbnails, webcam snapshots, and NIC images using `multer`.
- **Text Extraction**: Automatic plain text extraction from uploaded PDFs (`pdf-parse`) and YouTube video transcripts (`youtube-transcript`) replacing Django post-save signals.
- **AI Assessment Generator & Tutor**: Directly integrated with `@google/generative-ai` for automated test generation and context-aware chat tutoring.
- **Email Notifications**: Integrated with SMTP via `nodemailer` for candidate invitations, admin onboarding credentials, and password resets.

---

## 📁 Directory Structure

```
TrainingManiaBackend-Node/
├── prisma/
│   ├── schema.prisma              # Database schema & relations
│   └── dev.db                     # SQLite database
├── src/
│   ├── config/
│   │   └── db.js                  # Prisma Client singleton
│   ├── controllers/
│   │   ├── auth.controller.js     # Admin & Candidate login / password flows
│   │   ├── superadmin.controller.js # Global stats, admins, candidate & course audits
│   │   ├── admin.controller.js    # Training modules, candidates, enrollments, reports
│   │   ├── candidate.controller.js# Candidate dashboard, test taking & submissions
│   │   └── ai.controller.js       # Quiz generation & AI tutor chatbot
│   ├── middlewares/
│   │   ├── auth.middleware.js     # X-Admin-ID & JWT token handling
│   │   ├── upload.middleware.js   # Multer file storage config
│   │   └── errorHandler.js        # Central error handler
│   ├── routes/
│   │   ├── auth.routes.js         # /api/auth/* & /api/admin/* auth routes
│   │   ├── superadmin.routes.js   # /api/superadmin/*
│   │   ├── admin.routes.js        # /api/admin/* & /api/training/create
│   │   ├── candidate.routes.js    # /api/candidate/* & /api/test/submit
│   │   ├── ai.routes.js           # /api/generate-questions & /api/chat
│   │   └── index.js               # Route aggregator
│   ├── services/
│   │   ├── ai.service.js          # Google Gemini 2.0 Flash SDK service
│   │   ├── extractor.service.js   # PDF & YouTube transcript extraction
│   │   └── mail.service.js        # Nodemailer SMTP engine
│   ├── app.js                     # Express application & CORS configuration
│   └── server.js                  # Server startup & database connection
├── media/                         # Uploaded files root (/media/*)
├── .env                           # Environment variables
├── test-api.js                    # Automated 20-point integration test suite
└── package.json
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js v18+ (tested on Node v24.18.0)
- npm v9+

### 2. Environment Setup
The `.env` file is pre-configured:
```env
PORT=8000
DATABASE_URL="file:./dev.db"
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="trainingmania_secret_jwt_token_key_2026"

# Email Configuration (SMTP)
EMAIL_HOST="mail.techmiresolutions.com"
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER="trainingmania@techmiresolutions.com"
EMAIL_PASS="!!YaHussain110!!"
EMAIL_FROM="trainingmania@techmiresolutions.com"
EMAIL_BCC="trainingmania@techmiresolutions.com"

# Google Gemini API Key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 3. Running the Server

```bash
# Start server in standard mode
npm start

# Or start in watch / development mode
npm run dev
```

### 4. Running Integration Tests

```bash
node test-api.js
```

---

## 🔌 API Endpoints Reference

### Candidate Auth & Training
- `POST /api/auth/login/` - Login (access code or password)
- `POST /api/auth/set-password/` - Set initial password
- `POST /api/auth/forgot-password/` - Reset password
- `GET /api/candidate/:id/dashboard/` - Fetch enrolled courses & test progress
- `GET /api/training/:id/` - Module content & test configuration
- `POST /api/test/submit/` - Submit test answers & proctoring verification

### Admin Operations
- `POST /api/admin/login/` - Admin login
- `POST /api/admin/register/` - Register new admin
- `POST /api/admin/forgot-password/` - Admin password reset
- `POST /api/training/create/` - Create new training module (multipart)
- `GET /api/admin/trainings/` - List admin's trainings
- `DELETE /api/admin/trainings/:id/` - Delete training module
- `GET, POST, DELETE /api/admin/candidates/` - Candidate management
- `GET, POST, PATCH, DELETE /api/admin/enrollments/` - Candidate course enrollment
- `GET, DELETE /api/admin/reports/` - Test submission reports
- `GET /api/admin/notifications/` - System & activity notifications

### Super Admin Operations
- `GET /api/superadmin/stats/` - Global system counts
- `GET, POST /api/superadmin/admins/` - List and provision admins
- `DELETE /api/superadmin/admins/:id/` - Remove admin
- `GET, DELETE /api/superadmin/candidates/` - Global candidate directory
- `GET, DELETE /api/superadmin/trainings/` - Global training modules directory
- `GET /api/superadmin/trainings/:id/candidates/` - Training enrollment list
- `POST /api/superadmin/check-bounces/` - Check email bounce status

### AI Engine
- `POST /api/generate-questions/` - Generate MCQs, fill-in-the-blanks, short answers from PDF
- `GET, POST /api/chat/` - Context-grounded AI Tutor chatbot

---

## 🛡️ Production Hardening & Database Pooling

### 1. Zod Validation Layer
All incoming multipart form-data and nested JSON payloads are pre-validated and sanitized by Zod schemas in `src/validators/schemas.js`:
- Blocks invalid payloads before reaching Prisma or AI services
- Provides DRF-compatible field error payloads (`{ error: "...", details: { field: [...] } }`)

### 2. Database Connection Pooling (PostgreSQL Migration)
When switching from local SQLite to a cloud PostgreSQL provider (Supabase, AWS RDS, Neon, or Render):
1. In `prisma/schema.prisma`, update provider to `postgresql`.
2. In `.env`, add connection limit parameters to prevent connection pool exhaustion during concurrent exam submissions:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?connection_limit=5&pool_timeout=10"
   ```
   - `connection_limit=5`: Caps maximum concurrent database connections per Node instance.
   - `pool_timeout=10`: Sets a 10-second timeout before queuing requests if all connections are saturated.
3. Run `npx prisma db push` or `npx prisma migrate deploy`.
