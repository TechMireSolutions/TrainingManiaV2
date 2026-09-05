# Training Mania - AI-Powered Corporate Training & Assessment Platform

**Training Mania** is an enterprise assessment and certification platform featuring automated test generation via **Google Gemini**, context-grounded **AI Tutoring**, proctored online examinations, and multi-tenant role-based access control.

---

## 🏗️ Clean Project Architecture

```
trainingmaniabackend-finalbackendplusfrontend/
├── TrainingManiaBackend-Node/     # Node.js 20 + Express + Prisma ORM + Gemini AI backend (Port 8000)
├── TrainingManiafrontend/         # React 19 + Vite + TailwindCSS frontend (Port 5173 / Port 80)
├── docker-compose.yml             # Unified production multi-service deployment
└── README.md                      # Architecture & Getting Started guide
```

---

## 🚀 Quick Start (Local Development)

### 1. Start the Node.js Backend
```powershell
cd TrainingManiaBackend-Node
npm install
npm start
```
The backend starts on **`http://localhost:8000`**.

### 2. Start the React Frontend
```powershell
cd TrainingManiafrontend
npm install
npm run dev
```
The web application runs on **`http://localhost:5173`** and reverse-proxies `/api` and `/media` directly to the Node.js backend.

---

## 🐳 Docker Deployment (Production)

To launch the complete platform (PostgreSQL 16 + Node.js Backend + React/Nginx Frontend) with a single command:

```powershell
docker compose up --build -d
```
Access the application on **`http://localhost`**.

---

## 🧪 Automated Verification Suite

Run the full real-world lifecycle test from the backend folder:
```powershell
cd TrainingManiaBackend-Node
node run-e2e-check.js
```
Runs and verifies all 6 core stages:
1. Admin registration & login
2. Training module creation with Zod validation
3. Candidate registration & course enrollment
4. Candidate access code login & password creation
5. Proctored exam submission & auto-scoring
6. Admin reports & proctoring audit
