# SgStudyPal (Gemini Live Agent Challenge)

SgStudyPal is an AI-powered educational platform designed for students in Singapore. Our platform features an intelligent, multimodal AI tutor ("Gwen") capable of solving uploaded math problems using local pedagogical methods, supported by real-time WebSockets integration for an interactive learning experience.

## Architecture & Tech Stack

This project is built using modern web development standards within a strict monorepo architecture:

- **Framework**: Next.js 14 (App Router)
- **Monorepo**: Turborepo
- **AI Integration**: Vercel AI SDK (@ai-sdk/react, @ai-sdk/google)
- **AI Models**: Google Gemini 2.5 Flash / Pro
- **Deployment**: Google Cloud Run & Docker Multi-Stage Builds
- **Backend/Auth**: Firebase & Firestore
- **Styling**: Tailwind CSS & Framer Motion

## Prerequisites

Before setting up the project locally, ensure you have the following installed:

- **Node.js** (v18.17.0 or higher recommended)
- **npm** or **pnpm** (used for Turborepo package management)

## Local Spin-Up Instructions

To run this Next.js Turborepo locally and test the AI features, follow these exact steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lesterchee/sgstudypal-hackathon.git
   ```

2. **Navigate to the project root:**
   ```bash
   cd sgstudypal-hackathon
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure Environment Variables:**
   Navigate into the primary web application directory:
   ```bash
   cd apps/sg-tutor
   ```
   Create a `.env.local` file in the `apps/sg-tutor` directory with the following keys:
   
   ```env
   # Gemini API Credentials
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

   # Firebase Client Credentials (Required for local Next.js build compilation)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

5. **Run the Development Server:**
   From the root directory (`sgstudypal-hackathon`), start the Turborepo development server:
   ```bash
   # Make sure you are at the monorepo root!
   npm run dev
   ```

The application will compile and become available at [http://localhost:3000](http://localhost:3000). 
Navigate to the `/dashboard/homework-help` route to test the multimodal AI agent directly!
