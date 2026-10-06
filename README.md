# CalendarMeet.ai — AI-Powered Google Calendar Meeting Assistant

An AI-powered, chat-first calendar assistant single-page application built with React 18, TypeScript, Tailwind CSS, and Motion on the frontend, and Node.js/Express, Google OAuth2, Google Calendar API v3, Gemini API (with function calling), BullMQ, and MongoDB on the backend.

---

## 🏛️ System Architecture

```text
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐
│   React     │─────▶│  Node/Express    │─────▶│  Google OAuth2  │
│   (chat UI) │◀─────│  API Gateway     │◀─────│  + Calendar API │
└─────────────┘      └──────────────────┘      └────────────────┘
                             │      │
                    ┌────────┘      └────────┐
                    ▼                        ▼
            ┌──────────────┐        ┌────────────────┐
            │ Gemini API   │        │  Job Queue      │
            │ (intent +    │        │  (BullMQ+Redis) │
            │  function    │        └────────┬────────┘
            │  calling)    │                 ▼
            └──────────────┘        ┌────────────────┐
                    │                │  Worker(s)     │
                    ▼                │  → Google API  │
            ┌──────────────┐        └────────────────┘
            │  MongoDB      │
            │  users, tokens│
            │  meetings     │
            │  chat logs    │
            └──────────────┘
```

---

## ✨ Features

- **Dedicated Chat Application**: A clean, modern conversational interface (inspired by ChatGPT and Linear) rather than a confusing calendar grid.
- **Real Google Calendar Sync**: When you schedule a meeting in the chat, it calls `calendar.events.insert` on your genuine Google Calendar (`calendar.google.com`).
- **Attendee Email Invitations**: The backend automatically adds both your email and the recipient's email (`attendees: [{ email: userEmail }, { email: attendeeEmail }]`) and sets `sendUpdates: 'all'`, dispatching real Google Calendar invitation emails.
- **Google Meet Auto-Conferencing**: Generates official Google Meet conference links for every scheduled meeting.
- **Pre-Confirmation Cards**: Before committing any action to Google Calendar, the assistant generates an interactive confirmation card showing host email, attendee email, time, and Google Meet link.
- **Gemini API Tool Calling**: Uses Gemini 1.5 Flash structured function calling (`schedule_meeting`, `cancel_meeting`, `list_upcoming_meetings`) with a resilient heuristic fallback for offline development.
- **BullMQ + Redis Job Queue**: Asynchronously offloads Google API mutations to background workers.
- **MongoDB Persistence**: Stores users, OAuth access/refresh tokens, meeting records, and conversation history.

---

## 🚀 Quick Start with Docker

The easiest way to run the complete stack (MongoDB, Redis, Node/Express, and React) is with Docker Compose:

```bash
# 1. Clone or navigate to the repository
cd CalendarMeet.ai

# 2. Configure your environment variables
cp .env.example .env

# 3. Start all services
docker compose up --build
```

- **Frontend Chat App**: `http://localhost:3000`
- **Backend API Gateway**: `http://localhost:5000`
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

---

## 💻 Local Development Setup

### 1. Backend Server (`server/`)

```bash
cd server
npm install

# Start Express in watch mode
npm run dev
```

### 2. Frontend Client (`client/`)

```bash
cd client
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:3000/` in your browser.

---

## 🔑 Setting Up Real Google OAuth & Calendar API

To connect with your actual Google account and have meetings appear at `calendar.google.com`:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `CalendarMeet-AI`).
3. Under **APIs & Services > Library**, search for and **Enable** the **Google Calendar API**.
4. Under **APIs & Services > OAuth Consent Screen**:
   - Choose **External** (or Internal for Workspace).
   - Set app name to `CalendarMeet.ai`.
   - Add scopes:
     - `.../auth/calendar`
     - `.../auth/calendar.events`
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Add your Google email as a **Test User**.
5. Under **APIs & Services > Credentials**:
   - Create **OAuth 2.0 Client IDs** -> Web application.
   - Authorized JavaScript origins: `http://localhost:3000` and `http://localhost:5000`.
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`.
6. Copy the **Client ID** and **Client Secret** into your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   ```

---

## 🤖 Setting Up Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create an API key.
3. Paste it into your `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

