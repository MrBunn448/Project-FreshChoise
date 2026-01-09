const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const SALT = 10;

const app = express();
app.use(express.json());
app.use(cors());

// -----------------------------
// MySQL CONNECTIE
// -----------------------------
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fresh_choice', 
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected');
});

// -----------------------------
// REGISTREREN
// -----------------------------
app.post('/api/register', async (req, res) => {
    let { naam, email, wachtwoord, telefoon, adres } = req.body;

    if (!naam || !email || !wachtwoord) {
        return res.status(400).json({ error: "Ontbrekende velden: naam, email en wachtwoord zijn vereist." });
    }

  
    email = String(email).trim().toLowerCase();


    const checkQ = "SELECT id FROM klant WHERE email = ? LIMIT 1";
    db.query(checkQ, [email], async (checkErr, results) => {
        if (checkErr) {
            console.error('DB error when checking email existence:', checkErr);
            return res.status(500).json({ error: "Database fout bij controleren e-mail." });
        }

        if (results && results.length > 0) {
            console.error("Result not empty")
            return res.status(400).json({ error: "E-mail bestaat al." });
        }

        try {
            const hash = await bcrypt.hash(wachtwoord, SALT);

            const insertQ = `
                INSERT INTO klant (naam, email, password_hash)
                VALUES (?, ?, ?)
            `;
            
            db.query(insertQ, [naam, email, hash], (insErr, result) => {
                if (insErr) {
                    console.error('DB error when inserting klant:', insErr);
                    return res.status(500).json({ error: "Database fout bij aanmaken account." });
                }

                res.status(201).json({ message: "Account aangemaakt!", id: result.insertId });
            });
        } catch (err) {
            console.error('Server error during registration:', err);
            res.status(500).json({ error: "Server fout." });
        }
    });
});

// -----------------------------
// LOGIN
// -----------------------------
app.post('/api/login', (req, res) => {
    const { email, wachtwoord } = req.body;

    email = String(email).trim().toLowerCase();

    const q = "SELECT * FROM klant WHERE email = ? LIMIT 1";

    db.query(q, [email], async (err, results) => {
        if (err || results.length === 0)
            return res.status(401).json({ error: "Email of wachtwoord klopt niet." });

        const user = results[0];
        const pwMatch = await bcrypt.compare(wachtwoord, user.password_hash);

        if (!pwMatch)
            return res.status(401).json({ error: "Email of wachtwoord klopt niet." });

        res.json({
            id: user.id,
            naam: user.naam,
            email: user.email
        });
    });
});

// -----------------------------
// SERVER STARTEN
// -----------------------------
app.listen(3001, () => console.log('Server draait op http://localhost:3001'));

