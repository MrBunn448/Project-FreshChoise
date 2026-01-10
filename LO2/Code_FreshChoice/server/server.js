const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const session = require('express-session');
const MySQLSessionStore = require("express-mysql-session")(session);
//const MySQLStore = require('connect-mysql2')(session);

const SALT_ROUNDS = 10;

const app = express();
app.use(express.json());

// ✅ CORS moet credentials toestaan voor cookies
app.use(cors({
  origin: "http://localhost:5173",   // Vite
  credentials: true
}));

// -----------------------------
// MySQL CONNECTIE
// -----------------------------
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fresh_choice',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, conn) => {
  if (err) throw err;
  console.log("MySQL connected");
  conn.release();
});
// -----------------------------
// SESSIONS (MySQL session store)
// -----------------------------
const sessionStore = new MySQLSessionStore(
  {
    host: "localhost",
    user: "root",
    password: "",
    database: "fresh_choice",
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000,
  }
);

app.use(session({
  name: "freshchoice.sid",
  secret: "change_this_secret_for_school_project", // later in .env
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: false,     // lokaal op http
    sameSite: "lax",   // prima voor localhost
    maxAge: 24 * 60 * 60 * 1000,
  }
}));

// -----------------------------
// AUTH MIDDLEWARE
// -----------------------------
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Niet ingelogd." });
  }
  next();
}

// -----------------------------
// ALLERGENEN OPHALEN
// -----------------------------
app.get('/api/allergenen', (req, res) => {
  const q = "SELECT id, naam FROM allergenen ORDER BY naam ASC";
  db.query(q, (err, results) => {
    if (err) {
      console.error("DB error fetching allergenen:", err);
      return res.status(500).json({ error: "Database fout." });
    }
    res.json(results);
  });
});

// -----------------------------
// REGISTREREN (optioneel allergenen) - POOL + TRANSACTION
// -----------------------------
app.post('/api/register', async (req, res) => {
  let conn;

  try {
    let { naam, email, wachtwoord, adres, telefoonnummer, allergenen } = req.body;

    if (!naam || !email || !wachtwoord) {
      return res.status(400).json({ error: "Ontbrekende velden: naam, email en wachtwoord zijn vereist." });
    }

    naam = String(naam).trim();
    email = String(email).trim().toLowerCase();
    wachtwoord = String(wachtwoord);

    adres = adres ? String(adres).trim() : null;
    telefoonnummer = telefoonnummer ? String(telefoonnummer).trim() : null;

    const allergenenIds = Array.isArray(allergenen)
      ? allergenen.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    // ✅ pak een connection uit de pool
    conn = await db.promise().getConnection();

    // check email bestaat al
    const [existing] = await conn.query("SELECT id FROM klant WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      conn.release();
      return res.status(400).json({ error: "E-mail bestaat al." });
    }

    await conn.beginTransaction();

    const hash = await bcrypt.hash(wachtwoord, SALT_ROUNDS);

    // klant insert
    const [klantRes] = await conn.query(
      "INSERT INTO klant (naam, email, password_hash) VALUES (?, ?, ?)",
      [naam, email, hash]
    );
    const klantId = klantRes.insertId;

    // klantinformatie insert (adres/telefoon optioneel)
    await conn.query(
      "INSERT INTO klantinformatie (klant_id, adres, telefoonnummer) VALUES (?, ?, ?)",
      [klantId, adres, telefoonnummer]
    );

    // allergenen insert (optioneel)
    if (allergenenIds.length > 0) {
      const values = allergenenIds.map((aid) => [klantId, aid]);
      await conn.query("INSERT INTO klant_allergenen (klant_id, allergeen_id) VALUES ?", [values]);
    }

    await conn.commit();
    conn.release();

    return res.status(201).json({ message: "Account aangemaakt!", id: klantId });
  } catch (err) {
    console.error("Error in /api/register:", err);

    try {
      if (conn) {
        await conn.rollback();
        conn.release();
      }
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }

    return res.status(500).json({ error: "Registreren mislukt." });
  }
});

// -----------------------------
// LOGIN (zet session userId)
// -----------------------------
app.post('/api/login', (req, res) => {
  let { email, wachtwoord } = req.body;

  email = String(email || "").trim().toLowerCase();
  wachtwoord = String(wachtwoord || "");

  if (!email || !wachtwoord) {
    return res.status(400).json({ error: "Email en wachtwoord zijn vereist." });
  }

  const q = "SELECT * FROM klant WHERE email = ? LIMIT 1";
  db.query(q, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database fout." });
    if (!results || results.length === 0) return res.status(401).json({ error: "Email of wachtwoord klopt niet." });

    const user = results[0];
    const pwMatch = await bcrypt.compare(wachtwoord, user.password_hash);
    if (!pwMatch) return res.status(401).json({ error: "Email of wachtwoord klopt niet." });

    // ✅ session opslaan
    req.session.userId = user.id;

    res.json({ id: user.id, naam: user.naam, email: user.email });
  });
});

// -----------------------------
// LOGOUT
// -----------------------------
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Uitloggen mislukt." });

    res.clearCookie("freshchoice.sid");
    res.json({ message: "Uitgelogd." });
  });
});

// -----------------------------
// ME (handig voor frontend: check session)
// -----------------------------
app.get('/api/me', requireAuth, (req, res) => {
  const userId = req.session.userId;
  db.query("SELECT id, naam, email FROM klant WHERE id = ? LIMIT 1", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database fout." });
    if (!results || results.length === 0) return res.status(404).json({ error: "User niet gevonden." });
    res.json(results[0]);
  });
});

// -----------------------------
// PROFIEL OPHALEN (adres/telefoon) via session
// -----------------------------
app.get('/api/profile', requireAuth, (req, res) => {
  const userId = req.session.userId;

  const q = `
    SELECT k.id, k.naam, k.email, ki.adres, ki.telefoonnummer
    FROM klant k
    LEFT JOIN klantinformatie ki ON ki.klant_id = k.id
    WHERE k.id = ?
    LIMIT 1
  `;

  db.query(q, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database fout." });
    if (!results || results.length === 0) return res.status(404).json({ error: "User niet gevonden." });
    res.json(results[0]);
  });
});

// -----------------------------
// PROFIEL OPSLAAN (adres/telefoon) via session
// -----------------------------
app.put('/api/profile', requireAuth, (req, res) => {
  const userId = req.session.userId;

  let { adres, telefoonnummer } = req.body;
  adres = adres ? String(adres).trim() : null;
  telefoonnummer = telefoonnummer ? String(telefoonnummer).trim() : null;

  // Upsert (werkt als klantinformatie.klant_id UNIQUE is)
  const q = `
    INSERT INTO klantinformatie (klant_id, adres, telefoonnummer)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      adres = VALUES(adres),
      telefoonnummer = VALUES(telefoonnummer)
  `;

  db.query(q, [userId, adres, telefoonnummer], (err) => {
    if (err) {
      console.error("DB error saving profile:", err);
      return res.status(500).json({ error: "Database fout bij opslaan profiel." });
    }
    res.json({ message: "Profiel opgeslagen." });
  });
});

// -----------------------------
// SERVER STARTEN
// -----------------------------
app.listen(3001, () => console.log('Server draait op http://localhost:3001'));