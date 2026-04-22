# Shadow Terminal — Hacker Simulation Game

An immersive, full-stack hacker simulation terminal game. Infiltrate MegaCorp, complete 5 missions, and rise through the ranks.

## Architecture

- **Backend:** Node.js + Express + SQLite (better-sqlite3)
- **Frontend:** Pure HTML/CSS/JS UI shell — no game logic, no answers
- **Auth:** JWT httpOnly cookies, bcrypt password hashing
- **Security:** Helmet, rate limiting, parameterized queries, input sanitization

All game logic, mission data, command validation, XP calculations, and answers live **exclusively on the server**. The frontend is a rendering shell that sends user input to the API and displays results.

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd Shadow-Terminal

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your own JWT_SECRET

# 4. Start the server
npm run dev
# or
npm start
```

Open `http://localhost:3000` in your browser.

## Project Structure

```
Shadow-Terminal/
├── server.js          # Express server, all API routes & game logic
├── missions.js        # Mission data (server-side only, gitignored)
├── db.js              # SQLite schema & connection
├── auth.js            # JWT sign/verify helpers
├── middleware.js       # Auth middleware
├── package.json
├── .env               # Environment variables (gitignored)
├── .env.example       # Template for .env
├── .gitignore
├── public/
│   └── index.html     # Frontend UI shell (no game logic)
└── README.md
```

## API Routes

| Method | Route                    | Auth | Description                              |
|--------|--------------------------|------|------------------------------------------|
| POST   | `/api/register`          | No   | Create new account                       |
| POST   | `/api/login`             | No   | Login, receive JWT cookie                |
| POST   | `/api/logout`            | No   | Clear JWT cookie                         |
| GET    | `/api/me`                | Yes  | User profile, rank, achievements         |
| GET    | `/api/session`           | Yes  | Current game session state               |
| POST   | `/api/session/start`     | Yes  | Start new game (or replay with reset)    |
| POST   | `/api/session/next-mission` | Yes | Advance to next mission                |
| POST   | `/api/command`           | Yes  | Submit a command (server validates)      |
| POST   | `/api/hint`              | Yes  | Get hint for current step (-50 XP)       |
| GET    | `/api/leaderboard`       | No   | Top 10 scores                            |

## Features

- **5 Missions** with multi-step objectives and story narrative
- **Rank System:** ROOKIE → HACKER → ELITE → GHOST → PHANTOM
- **Achievements:** First Blood, No Hints, Speedrun, Ghost Protocol, Untouchable
- **Session Persistence:** Resume exactly where you left off
- **Server-side Timer:** Prevents client-side time manipulation
- **Leaderboard:** Global top 10 scores
- **Dev Tools Disabled:** F12, Right-click, Ctrl+Shift+I silently blocked

## Security

- missions.js is gitignored — answers never leak to version control
- All game state managed server-side in SQLite
- JWT httpOnly cookies (not localStorage)
- Rate limiting: 60 cmd/min, 10 auth/min
- Input sanitization: max 100 chars, HTML stripped
- Helmet.js security headers
- Parameterized SQL queries only
- No `eval()` anywhere

## Environment Variables

| Variable     | Description                    | Default   |
|-------------|--------------------------------|-----------|
| `PORT`      | Server port                    | 3000      |
| `JWT_SECRET`| Secret key for JWT signing     | (required)|
