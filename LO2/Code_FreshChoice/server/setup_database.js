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

// Add products table and seed three POC products which map to allergenen seeded above.
// For this POC there are exactly 3 products: brood (gluten), kaas (lactose), noten (noten)
const PRODUCTS_SQL = `
  -- PRODUCTS table (POC)
  CREATE TABLE IF NOT EXISTS product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(255) NOT NULL,
    prijs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    allergeen_id INT NULL,
    CONSTRAINT fk_product_allergeen FOREIGN KEY (allergeen_id) REFERENCES allergenen(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;

  -- Seed the three allowed products. We use INSERT ... SELECT to map to the allergenen rows created above.
  INSERT INTO product (naam, prijs, allergeen_id)
  SELECT 'Brood', 2.75, a.id FROM allergenen a WHERE a.naam LIKE '%gluten%';

  INSERT INTO product (naam, prijs, allergeen_id)
  SELECT 'Kaas', 3.50, a.id FROM allergenen a WHERE a.naam LIKE '%melk%';

  INSERT INTO product (naam, prijs, allergeen_id)
  SELECT 'Noten', 4.25, a.id FROM allergenen a WHERE a.naam LIKE '%noten%';
`;

// Orders table to persist POC orders and barcode for external systems
const ORDERS_SQL = `
  CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    klant_id INT NULL,
    brood_qty INT NOT NULL DEFAULT 0,
    kaas_qty INT NOT NULL DEFAULT 0,
    noten_qty INT NOT NULL DEFAULT 0,
    barcode VARCHAR(16) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_klant FOREIGN KEY (klant_id) REFERENCES klant(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;
`;

connection.connect(err => {
  if (err) throw err;
  console.log("Connected to MySQL. Running migration...");
  connection.query(MIGRATION_SCRIPT + PRODUCTS_SQL + ORDERS_SQL, (err) => {
    if (err) throw err;
    console.log("\u2705 Database setup complete!");
    connection.end();
  });
});
