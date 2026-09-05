# Training Mania - AI-Powered Corporate Training & Assessment Platform

**Training Mania** is an enterprise assessment and certification platform featuring automated test generation via **Google Gemini**, context-grounded **AI Tutoring**, proctored online examinations, and role-based access control (Superadmin, Admin, Candidate).

---

## 🏗️ Architecture

```
TrainingManiaV2/
├── TrainingManiaBackend-Node/     # Node.js 20+ + Express + Prisma ORM + Gemini AI (Port 8000)
├── TrainingManiafrontend/         # React 19 + Vite + TailwindCSS frontend (Port 80 / 5173)
├── docker-compose.yml             # One-command Docker production deployment
├── .gitignore                     # Repository hygiene & security
└── README.md                      # Documentation & VPS deployment guide
```

---

## 🌐 Production VPS Deployment Guide

### Method A: One-Command Docker Deployment (Recommended)

1. **Clone the repository on your VPS**:
   ```bash
   git clone https://github.com/TechMireSolutions/TrainingManiaV2.git
   cd TrainingManiaV2
   ```

2. **Configure Environment**:
   Create or edit `.env` in `TrainingManiaBackend-Node/`:
   ```bash
   cp TrainingManiaBackend-Node/.env.example TrainingManiaBackend-Node/.env
   # Edit .env with your domain, SMTP credentials, and Gemini API key
   ```

3. **Launch with Docker Compose**:
   ```bash
   docker compose up --build -d
   ```
   The platform will be live on **`http://<YOUR_VPS_IP>`** or your configured domain on port `80`.

4. **(Optional) Seed Initial Production Data & Admin User**:
   ```bash
   docker exec -it trainingmania-backend npm run seed
   ```
   Default seeded administrator:
   - **Email**: `admin@trainingmania.com`
   - **Password**: `tms12345`

---

### Method B: Manual / PM2 Deployment on VPS (Without Docker)

#### 1. Backend Setup:
```bash
cd TrainingManiaBackend-Node
npm install
npx prisma generate
npx prisma db push
npm run seed     # Optional initial seed
npm install -g pm2
pm2 start src/server.js --name "trainingmania-backend"
```

#### 2. Frontend Setup:
```bash
cd ../TrainingManiafrontend
npm install
npm run build
```
Serve the `dist/` directory using Nginx or Caddy with proxy rules for `/api/` and `/media/` pointing to `http://127.0.0.1:8000/`.

---

## 🚀 Local Development

### 1. Backend:
```bash
cd TrainingManiaBackend-Node
npm install
npm start
```
Runs at `http://localhost:8000`.

### 2. Frontend:
```bash
cd TrainingManiafrontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

---

## 🧪 Automated Verification Suite

Run the full end-to-end integration verification:
```bash
cd TrainingManiaBackend-Node
node run-e2e-check.js
```
Runs all 6 core stages:
1. Admin registration & authentication
2. Training module creation with Zod payload validation
3. Candidate registration & course enrollment
4. Candidate access code login & password creation
5. Proctored exam submission & auto-scoring
6. Admin reports & proctoring audit
