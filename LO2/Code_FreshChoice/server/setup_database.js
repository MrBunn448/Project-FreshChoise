const mysql = require('mysql2');
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  multipleStatements: true
};

const connection = mysql.createConnection(dbConfig);

const MIGRATION_SCRIPT = `
  DROP DATABASE IF EXISTS fresh_choice;
  CREATE DATABASE fresh_choice CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
  USE fresh_choice;

  -- KLANT
  CREATE TABLE klant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;

  -- KLANTINFORMATIE (1-op-1 met klant, klant_id UNIQUE)
  CREATE TABLE klantinformatie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    klant_id INT NOT NULL UNIQUE,
    adres VARCHAR(255) NULL,
    telefoonnummer VARCHAR(20) NULL,
    CONSTRAINT fk_klantinformatie_klant
      FOREIGN KEY (klant_id) REFERENCES klant(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB;

  -- ALLERGENEN
  CREATE TABLE allergenen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(255) NOT NULL UNIQUE
  ) ENGINE=InnoDB;

  -- KLANT_ALLERGENEN (koppeltabel)
  CREATE TABLE klant_allergenen (
    klant_id INT NOT NULL,
    allergeen_id INT NOT NULL,
    PRIMARY KEY (klant_id, allergeen_id),
    CONSTRAINT fk_klant_allergenen_klant
      FOREIGN KEY (klant_id) REFERENCES klant(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_klant_allergenen_allergeen
      FOREIGN KEY (allergeen_id) REFERENCES allergenen(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB;

  -- (OPTIONEEL) SESSIONS TABLE (als je het liever expliciet maakt)
  -- Als je server connect-mysql2 gebruikt met createDatabaseTable: true,
  -- dan is dit niet nodig.
  CREATE TABLE IF NOT EXISTS sessions (
    session_id varchar(128) collate utf8mb4_bin NOT NULL,
    expires int(11) unsigned NOT NULL,
    data mediumtext collate utf8mb4_bin,
    PRIMARY KEY (session_id)
  ) ENGINE=InnoDB;

  -- SEED: allergenen
  INSERT INTO allergenen (naam) VALUES
    ('glutenbevattende granen'),
    ('schaaldieren'),
    ('ei'),
    ('vis'),
    ('pinda'),
    ('soja'),
    ('melk (inclusief lactose)'),
    ('noten'),
    ('selderij'),
    ('mosterd'),
    ('sesamzaad'),
    ('sulfiet'),
    ('lupine'),
    ('weekdieren');
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
