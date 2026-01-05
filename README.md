Care to see this in action? [Vibe-Selector](https://vibe-selector.vercel.app/)

Here is a professional and comprehensive **README.md** file for the project. This file summarizes the architecture, setup instructions, and the specific "Vibe Selector" design philosophy implemented.

---

# 🎵 Vibe Selector

A sleek, full-stack music streaming application featuring a high-fidelity **Glassmorphism "Zune-style" UI**. The app allows users to switch between different "vibes" (personas), triggering dynamic background changes and streaming randomized tracks from a managed PostgreSQL database.

## ✨ Features

* **Zune-Inspired Aesthetics**: A polished handheld player interface with realistic glass reflections, rim lighting, and backdrop blurs.
* **Dynamic Personas**: Seamlessly switch between "Ruby" and "Marshall" vibes with instant color-themed background transitions.
* **Smart Streaming**: Custom audio handling to manage Google Drive redirects and prevent browser "interrupted" playback errors.
* **Responsive Design**: Optimized for mobile and desktop using Tailwind CSS flexbox and container constraints.
* **Secure Backend**: Express.js API with CORS protection and SSL-encrypted connections to a Supabase PostgreSQL database.

## 🛠️ Technical Stack

* **Frontend**: [Next.js](https://nextjs.org/) (App Router), Tailwind CSS, Framer Motion (optional for animations).
* **Backend**: [Node.js](https://nodejs.org/), Express.js.
* **Database**: [Supabase](https://supabase.com/) (PostgreSQL) with Transaction Pooling via pgBouncer.
* **Hosting**: [Vercel](https://vercel.com/) (Frontend) and [Render](https://render.com/) (Backend).

## 🚀 Quick Start

### 1. Prerequisites

* Node.js (v18 or higher)
* A Supabase project with a table.

### 2. Environment Setup

Create a `.env` file in your **backend** folder:

```env
DATABASE_URL=
PORT=

```

Create a `.env.local` file in your **frontend** folder:

```env
NEXT_PUBLIC_API_URL=https://vibe-selector.vercel.app/

```

### 3. Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install

```

### 4. Running Locally

1. Start the backend: `npm start` (Runs on port 3000).
2. Start the frontend: `npm run dev` (Runs on port 3001).

## 🗄️ Database Schema

The application expects a table named `songs` with the following columns:

| Column | Type | Description |
| --- | --- | --- |
| `id` | int4 | Primary Key |
| `title` | varchar | The name of the track |
| `drive_id` | varchar | Clean Google Drive File ID (extracted from URL) |
| `persona` | varchar | The vibe name (e.g., 'Ruby' or 'Marshall') |

## 🎨 Asset Configuration

To maintain the custom UI, place the following images in the `frontend/public` directory:

* `ruby-bg.jpg` / `marshall-bg.jpg`: High-res background images.
* `ruby-thumb.jpg` / `marshall-thumb.jpg`: Square images for the circular orb buttons.

## 🔒 Security & Performance

* **SSL Configuration**: The backend uses `rejectUnauthorized: false` to allow secure cross-cloud communication between Render and Supabase.
* **Audio Optimization**: Implements `audio.load()` and `playPromise` logic to ensure the browser successfully buffers Google Drive streams before playback starts.

⚠️ Technical Notes

    Server Wake-up: The backend uses Render's free tier. Initial requests may experience a 30-60 second delay ("Cold Start").

    Manual Interaction: Due to browser Autoplay Policies, users must manually trigger a new vibe to load the next song. Continuous playback without interaction is not supported to ensure reliable streaming across all browsers.

🛠️ Troubleshooting Guide

1. No Audio Playing (Permissions)

    Folder Access: Ensure the Google Drive folder containing your music is set to "Anyone with the link can view.". If the file is private, the stream will return a 403 Forbidden error.

    Third-Party Cookies: Google Drive's "export" links sometimes require third-party cookies to be enabled in the user's browser. If music doesn't play in Chrome but works in Incognito, this is likely the cause.

2. "Playback Interrupted" Error

    Race Conditions: If a user clicks orbs too quickly, the browser may cancel the first play() request. The code includes a .catch() block to handle this gracefully without crashing the app.

    Autoplay Policies: Most browsers block audio until the user interacts with the page. The "Play Vibe" button acts as a fallback to ensure the browser registers a valid user gesture.

3. Backend Connection Issues

    CORS Errors: If you see "Cross-Origin Request Blocked," ensure the FRONTEND_URL environment variable on Render matches your Vercel domain.

    Cold Starts: On the Render Free Tier, the backend "sleeps" after 15 minutes of inactivity. It can take 30–60 seconds for the first vibe to load after a sleep period.

4. Database SSL Failures

    Connection Strings: Ensure your DATABASE_URL in Render uses the Transaction Pooler (port 6543).

    SSL Requirement: If the backend fails to connect to Supabase, check that rejectUnauthorized: false is set in your db.js file.

5. Mobile Display Issues

    Viewport Clipping: If the player looks cut off, ensure layout.tsx includes the standard <meta name="viewport" ... /> tag.

    Performance: High-intensity blurs (backdrop-blur-3xl) can lag on older mobile devices. Reduce to backdrop-blur-xl if performance is an issue.
