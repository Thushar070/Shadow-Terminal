# 🕶️ Shadow Terminal

> A full-stack hacker simulation game where players infiltrate systems, complete missions, and climb ranks.

---

## 🚀 Live Demo



## 🧠 Overview

Shadow Terminal is an interactive terminal-based hacking simulation built with a **secure backend-driven architecture**.

Players progress through missions like:

* Reconnaissance
* SSH Infiltration
* Privilege Escalation
* Data Extraction
* Covering Tracks

All commands are validated on the **server-side**, preventing cheating and ensuring realistic gameplay.

---

## ⚙️ Tech Stack

* **Backend:** Node.js, Express
* **Database:** SQLite
* **Auth:** JWT (httpOnly cookies), bcrypt
* **Frontend:** HTML, CSS, JavaScript
* **Security:** Helmet, Rate Limiting

---

## ✨ Features

* 🎯 5 Mission storyline with multiple objectives
* 🧪 Realistic terminal command simulation
* 🔐 Secure authentication system
* 📈 XP, Level, and Score tracking
* 🏆 Global leaderboard
* ⏱️ Server-controlled timer (anti-cheat)
* 💾 Session persistence

---

## 🏗️ Architecture

```
Client (UI) → API → Server Logic → Database
```

* Frontend = UI only (no answers exposed)
* Backend = all validation, logic, scoring
* Secure design prevents client-side manipulation

---

## 📂 Project Structure

```
Shadow-Terminal/
├── server.js
├── missions.js (hidden)
├── db.js
├── auth.js
├── middleware.js
└── public/
    └── index.html
```

---

## 🛠️ Installation

```bash
git clone <repo-url>
cd Shadow-Terminal
npm install
npm start
```

Open: http://localhost:3000

---

## 🔐 Security Highlights

* Server-side game logic (no client leaks)
* JWT stored in httpOnly cookies
* Rate limiting on commands & auth
* Input sanitization
* No eval usage

---

## 🧩 Future Enhancements

* Multiplayer hacking battles
* Real CTF-style challenges
* Advanced exploit chains
* Dark mode themes & UI upgrades

---


