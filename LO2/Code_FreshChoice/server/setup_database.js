const mysql = require('mysql2');
const dbConfig = { host: 'localhost', user: 'root', password: '', multipleStatements: true };
const connection = mysql.createConnection(dbConfig);

const MIGRATION_SCRIPT = `
    DROP DATABASE IF EXISTS fresh_choice;
    CREATE DATABASE fresh_choice;
    USE fresh_choice;

    CREATE TABLE klant (id INT AUTO_INCREMENT PRIMARY KEY, naam VARCHAR(255), email VARCHAR(255), password_hash VARCHAR(255), adres VARCHAR(255), telefoonnummer VARCHAR(20));
    CREATE TABLE allergenen (id INT AUTO_INCREMENT PRIMARY KEY, naam VARCHAR(255));
    CREATE TABLE klant_allergenen (klant_id INT, allergen_id INT, PRIMARY KEY (klant_id, allergen_id)); 

    INSERT INTO allergenen (naam) VALUES ('glutenbevattende granen'),
                                        ('ei'),
                                        ('vis'),
                                        ('pinda'),
                                        ('noten'),
                                        ('soja'),
                                        ('melk'),
                                        ('schaaldieren'),
                                        ('weekdieren'),
                                        ('selderij'),
                                        ('mosterd'),
                                        ('sesamzaad'),
                                        ('sulfiet'),
                                        ('lupine');
`;

connection.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL. Running migration...");
    connection.query(MIGRATION_SCRIPT, (err) => {
        if (err) throw err;
        console.log("✅ Database setup complete!");
        connection.end();
    });
});
