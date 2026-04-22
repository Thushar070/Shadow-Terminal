const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const MISSIONS = require('./missions');
const { signToken } = require('./auth');
const { authMiddleware } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "script-src-attr": ["'unsafe-inline'"],
      "connect-src": ["'self'"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": ["'self'", "data:"]
    },
  },
}));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests' }
});

const cmdLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Command rate limit exceeded' }
});

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ===================================================================
// HELPERS
// ===================================================================

const RANKS = [
  { xp: 6000, name: "PHANTOM" },
  { xp: 3000, name: "GHOST" },
  { xp: 1500, name: "ELITE" },
  { xp: 500, name: "HACKER" },
  { xp: 0, name: "ROOKIE" }
];

function getRank(xp) {
  return RANKS.find(r => xp >= r.xp).name;
}

function stripHtml(str) {
  return String(str).replace(/<[^>]*>/g, '').slice(0, 100);
}

function updateSessionTimer(session) {
  const now = new Date();
  const lastTick = new Date(session.last_tick + (session.last_tick.endsWith('Z') ? '' : 'Z'));
  const elapsed = Math.floor((now - lastTick) / 1000);

  if (elapsed > 0) {
    session.timer_remaining = Math.max(0, session.timer_remaining - elapsed);
    session.last_tick = now.toISOString();
  }
}

function buildSessionResponse(session) {
  const mission = MISSIONS[session.mission_idx];
  if (!mission) return null;
  return {
    missionIdx: session.mission_idx,
    stepIdx: session.step_idx,
    lives: session.lives,
    timerRemaining: session.timer_remaining,
    xp: session.xp,
    score: session.score,
    missionName: mission.name,
    missionStory: mission.story,
    missionTime: mission.time,
    objectives: mission.steps.map((s, i) => ({ text: s.obj, done: i < session.step_idx })),
    tools: mission.tools,
    wrongStreak: session.wrong_streak,
    status: session.status
  };
}

function checkAchievements(userId, session, missionIdx, final = false) {
  const newAchievements = [];

  const add = (key) => {
    try {
      db.prepare('INSERT INTO user_achievements (user_id, achievement_key) VALUES (?, ?)').run(userId, key);
      newAchievements.push(key);
    } catch (e) { /* already unlocked */ }
  };

  if (missionIdx === 0 && final) add("first_blood");
  if (session.hint_count === 0 && final) add("no_hints");

  const mission = MISSIONS[missionIdx];
  if (final && mission && session.timer_remaining > (mission.time * 0.8)) add("speedrun");

  if (final && missionIdx === MISSIONS.length - 1) add("ghost_protocol");

  if (final && missionIdx === MISSIONS.length - 1 && session.lives === 3) add("untouchable");

  return newAchievements;
}

// ===================================================================
// AUTH ROUTES
// ===================================================================

app.post('/api/register', authLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || !/^[a-zA-Z0-9]{3,16}$/.test(username) || password.length < 8) {
    return res.status(400).json({ error: 'Username: 3-16 alphanumeric. Password: 8+ chars.' });
  }

  try {
    const hash = bcrypt.hashSync(password, 12);
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
    const token = signToken({ id: result.lastInsertRowid, username });
    res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 24 * 3600000 });
    res.json({ success: true, user: { username, xp: 0, rank: "ROOKIE", score: 0 } });
  } catch (err) {
    res.status(400).json({ error: 'Username taken' });
  }
});

app.post('/api/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, username: user.username });
  res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 24 * 3600000 });
  res.json({ success: true, user: { username: user.username, xp: user.xp, rank: getRank(user.xp), score: user.score } });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token').json({ success: true });
});

// ===================================================================
// USER PROFILE
// ===================================================================

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT username, xp, score, missions_completed FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'User not found' });
  }
  const achievements = db.prepare('SELECT achievement_key FROM user_achievements WHERE user_id = ?').all(req.user.id);
  res.json({
    ...user,
    rank: getRank(user.xp),
    achievements: achievements.map(a => a.achievement_key)
  });
});

// ===================================================================
// SESSION ROUTES
// ===================================================================

app.get('/api/session', authMiddleware, (req, res) => {
  let session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(req.user.id);
  if (!session) return res.status(404).json({ error: 'No active session' });

  updateSessionTimer(session);
  db.prepare('UPDATE game_sessions SET timer_remaining = ?, last_tick = ? WHERE id = ?')
    .run(session.timer_remaining, session.last_tick, session.id);

  const data = buildSessionResponse(session);
  if (!data) return res.status(400).json({ error: 'Invalid session state' });
  res.json(data);
});

app.post('/api/session/start', authMiddleware, (req, res) => {
  const { replay } = req.body || {};
  const mission = MISSIONS[0];
  const now = new Date().toISOString();

  if (replay) {
    db.prepare('UPDATE users SET score = 0 WHERE id = ?').run(req.user.id);
  }

  db.prepare(`
    INSERT OR REPLACE INTO game_sessions
    (user_id, mission_idx, step_idx, lives, timer_remaining, wrong_streak, xp, score, hint_count, status, last_tick)
    VALUES (?, 0, 0, 3, ?, 0, 0, 0, 0, 'active', ?)
  `).run(req.user.id, mission.time, now);

  const session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(req.user.id);
  res.json(buildSessionResponse(session));
});

app.post('/api/session/next-mission', authMiddleware, (req, res) => {
  let session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(req.user.id);
  if (!session || session.status !== 'complete') return res.status(400).json({ error: 'Mission not complete' });

  const nextIdx = session.mission_idx + 1;
  if (nextIdx >= MISSIONS.length) return res.status(400).json({ error: 'No more missions' });

  const nextMission = MISSIONS[nextIdx];
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE game_sessions SET
    mission_idx = ?, step_idx = 0, timer_remaining = ?, wrong_streak = 0,
    xp = 0, hint_count = 0, status = 'active', last_tick = ?
    WHERE id = ?
  `).run(nextIdx, nextMission.time, now, session.id);

  const updated = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(req.user.id);
  res.json(buildSessionResponse(updated));
});

// ===================================================================
// COMMAND ROUTE — ALL GAME LOGIC
// ===================================================================

app.post('/api/command', authMiddleware, cmdLimiter, (req, res) => {
  let { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Empty command' });
  command = stripHtml(command).toLowerCase().trim();
  if (!command) return res.status(400).json({ error: 'Empty command' });

  let session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(req.user.id);
  if (!session || session.status !== 'active') return res.status(400).json({ error: 'No active session' });

  updateSessionTimer(session);

  // Check timeout
  if (session.timer_remaining <= 0) {
    db.prepare('UPDATE game_sessions SET status = "failed", timer_remaining = 0, last_tick = ? WHERE id = ?')
      .run(session.last_tick, session.id);
    return res.json({ result: "timeout", score: session.score });
  }

  // --- BUILT-IN COMMANDS ---
  if (command === 'help') {
    const m = MISSIONS[session.mission_idx];
    const toolList = m.tools.map(t => `  ${t.name.padEnd(14)} — ${t.desc}`).join('\n');
    return res.json({
      result: "info",
      response: `AVAILABLE TOOLS:\n${toolList}\n\nSYSTEM COMMANDS:\n  help           — Show this help\n  status         — Current mission info\n  profile        — Agent profile card\n  clear          — Clear terminal (local)\n  logout         — Disconnect session`
    });
  }
  if (command === 'status') {
    const m = MISSIONS[session.mission_idx];
    return res.json({
      result: "info",
      response: `MISSION: ${m.name}\nSTEP: ${session.step_idx + 1}/${m.steps.length}\nLIVES: ${'❤'.repeat(session.lives)}${'♡'.repeat(3 - session.lives)}\nXP: ${session.xp}\nSCORE: ${session.score}\nTIME: ${Math.floor(session.timer_remaining / 60)}:${String(session.timer_remaining % 60).padStart(2, '0')}`
    });
  }
  if (command === 'profile') {
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const achCount = db.prepare('SELECT COUNT(*) as c FROM user_achievements WHERE user_id = ?').get(req.user.id).c;
    return res.json({
      result: "info",
      response: `╔══════════════════════════╗\n║  AGENT PROFILE           ║\n╠══════════════════════════╣\n║  NAME:  ${u.username.padEnd(17)}║\n║  RANK:  ${getRank(u.xp).padEnd(17)}║\n║  XP:    ${String(u.xp).padEnd(17)}║\n║  SCORE: ${String(u.score).padEnd(17)}║\n║  ACHV:  ${String(achCount + '/5').padEnd(17)}║\n╚══════════════════════════╝`
    });
  }

  // --- MISSION COMMAND MATCHING ---
  const mission = MISSIONS[session.mission_idx];
  const step = mission.steps[session.step_idx];

  // Case-insensitive, trimmed, partial match
  const matched = step.keys.some(k => {
    const kLower = k.toLowerCase();
    if (command === kLower) return true;
    // Partial match: same base command and contains key arguments
    const cmdBase = command.split(' ')[0];
    const kBase = kLower.split(' ')[0];
    if (cmdBase === kBase) {
      const kParts = kLower.split(' ');
      if (kParts.length > 1) return command.includes(kParts[1]);
      return true;
    }
    return false;
  });

  if (matched) {
    session.wrong_streak = 0;
    session.xp += step.xp;
    session.score += step.xp;
    session.step_idx++;

    let missionDone = session.step_idx >= mission.steps.length;
    let achievements = [];
    let completionData = null;

    if (missionDone) {
      const timeBonus = session.timer_remaining * 2;
      session.score += timeBonus;
      session.status = 'complete';

      achievements = checkAchievements(req.user.id, session, session.mission_idx, true);

      db.prepare('INSERT INTO mission_completions (user_id, mission_idx, xp_earned, time_bonus) VALUES (?, ?, ?, ?)')
        .run(req.user.id, session.mission_idx, session.xp, timeBonus);

      db.prepare('UPDATE users SET xp = xp + ?, score = score + ?, missions_completed = ? WHERE id = ?')
        .run(session.xp, session.score, session.mission_idx + 1, req.user.id);

      db.prepare('INSERT INTO scores (user_id, score, mission) VALUES (?, ?, ?)')
        .run(req.user.id, session.score, session.mission_idx + 1);

      completionData = { xpEarned: session.xp, timeBonus, totalScore: session.score };
    }

    db.prepare('UPDATE game_sessions SET step_idx = ?, xp = ?, score = ?, wrong_streak = ?, status = ?, timer_remaining = ?, last_tick = ? WHERE id = ?')
      .run(session.step_idx, session.xp, session.score, session.wrong_streak, session.status, session.timer_remaining, session.last_tick, session.id);

    return res.json({
      result: "success",
      response: step.responses[Math.floor(Math.random() * step.responses.length)],
      xp: step.xp,
      stepDone: true,
      missionDone,
      newStepIdx: session.step_idx,
      objectives: mission.steps.map((s, i) => ({ text: s.obj, done: i < session.step_idx })),
      achievements,
      completionData,
      timerRemaining: session.timer_remaining
    });
  } else {
    // Wrong command
    session.wrong_streak++;
    let livesLost = 0;
    let timeBonus = 0;

    if (session.wrong_streak >= 3) {
      session.wrong_streak = 0;
      session.lives--;
      livesLost = 1;
      timeBonus = 30;
      session.timer_remaining = Math.min(session.timer_remaining + 30, mission.time);
    }

    if (session.lives <= 0) {
      session.status = 'failed';
    }

    db.prepare('UPDATE game_sessions SET lives = ?, wrong_streak = ?, timer_remaining = ?, status = ?, last_tick = ? WHERE id = ?')
      .run(session.lives, session.wrong_streak, session.timer_remaining, session.status, session.last_tick, session.id);

    if (session.status === 'failed') {
      return res.json({ result: "gameover", score: session.score });
    }

    return res.json({
      result: "wrong",
      message: "Command failed. Security systems engaged.",
      wrongStreak: session.wrong_streak,
      livesLost,
      lives: session.lives,
      timeBonus,
      timerRemaining: session.timer_remaining
    });
  }
});

// ===================================================================
// HINT ROUTE
// ===================================================================

app.post('/api/hint', authMiddleware, (req, res) => {
  let session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(req.user.id);
  if (!session || session.status !== 'active') return res.status(400).json({ error: 'No active session' });

  if (session.xp < 50) return res.status(400).json({ error: 'Not enough XP (need 50)' });

  const mission = MISSIONS[session.mission_idx];
  const step = mission.steps[session.step_idx];

  session.xp -= 50;
  session.score = Math.max(0, session.score - 50);
  session.hint_count++;

  db.prepare('UPDATE game_sessions SET xp = ?, score = ?, hint_count = ? WHERE id = ?')
    .run(session.xp, session.score, session.hint_count, session.id);

  res.json({ hint: step.hint, xp: session.xp });
});

// ===================================================================
// LEADERBOARD (public)
// ===================================================================

app.get('/api/leaderboard', (req, res) => {
  const scores = db.prepare(`
    SELECT u.username, MAX(s.score) as score
    FROM scores s
    JOIN users u ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY score DESC
    LIMIT 10
  `).all();
  res.json(scores);
});

// ===================================================================
// SERVE FRONTEND
// ===================================================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Shadow Terminal running at http://localhost:${PORT}`));
