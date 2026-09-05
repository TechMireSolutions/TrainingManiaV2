# Training Mania - Corporate Training Platform

Training Mania is a modern, comprehensive corporate training management system designed to streamline the process of creating, assigning, and tracking employee training modules. It features a dual-portal architecture for Administrators and Candidates.

## 🚀 Features

### 👨‍💼 Admin Portal

The command center for training managers.

- **Dashboard**: Real-time overview of active trainings, total candidates, and system status.
- **Training Management**: Create, edit, and delete training modules. Supports YouTube video integration and PDF documents.
- **Test Generation**: Automated test creation with configurable ratios for MCQs and Fill-in-the-Blanks.
- **Candidate Management**: Register candidates manually or via CSV bulk upload. Auto-generates access codes.
- **Enrollment**: Assign specific training modules to candidates.
- **Reports**: Track candidate performance and training completion rates.

### 👨‍🎓 Candidate Portal

A focused learning environment for employees.

- **Secure Login**: Access via email and unique access code (with password setting on first login).
- **My Courses**: View all assigned training modules in a clean grid layout.
- **Video Learning**: Integrated YouTube player for seamless video consumption.
- **Video Summary**: Key takeaways and insights displayed alongside the training video.
- **Assessment**: "Attempt Quiz" functionality to test knowledge after training (UI implemented).

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM](https://reactrouter.com/)

## 📦 Installation & Setup

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd TrainingManiaFront
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Start the development server**

    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

## 🔑 Default Access

### Admin Login

- **Email**: `admin@trainingmania.com`
- **Password**: `admin123`

### Candidate Login

- Create a new candidate via the Admin Portal to generate an access code.
- Use the candidate's email and the generated code to log in at `/candidate/login`.

## 🎨 Design System

The application uses a **Premium Light Theme**:

- **Backgrounds**: Soft slate (`bg-slate-50`) and pure white (`bg-white`).
- **Primary Color**: Indigo (`indigo-600`) for actions and branding.
- **Typography**: Clean sans-serif font with high readability (`text-slate-900` for headings, `text-slate-500` for body).
- **UI Elements**: Soft shadows, rounded corners, and consistent spacing for a modern feel.

## 🔄 Recent Updates (January 2026)

- **Landing Page**:
  - Fixed scrolling issues on non-mobile devices (laptops/tablets).
  - Implemented fully responsive scaling for text and cards to fit within the viewport.
- **Candidate Dashboard**:
  - Fixed PDF download button overflow issue for long filenames using robust flexbox layout.
- **Candidate Login**:
  - Added "Back to Home" button for easier navigation, matching the Admin Login design.
