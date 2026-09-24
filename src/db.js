const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      charset: 'utf8mb4',
      dateStrings: true,
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    name VARCHAR(100) PRIMARY KEY,
    value MEDIUMTEXT
  )`,
  `CREATE TABLE IF NOT EXISTS assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    mime VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    data LONGBLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS experiences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(190) NOT NULL,
    company VARCHAR(190) NOT NULL,
    location VARCHAR(190),
    start_label VARCHAR(50),
    end_label VARCHAR(50),
    is_current TINYINT(1) DEFAULT 0,
    bullets TEXT,
    visible TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value VARCHAR(30) NOT NULL,
    label VARCHAR(190) NOT NULL,
    detail VARCHAR(255),
    visible TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    category VARCHAR(100) NOT NULL,
    visible TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    degree VARCHAR(190) NOT NULL,
    school VARCHAR(190) NOT NULL,
    year_label VARCHAR(50),
    details TEXT,
    visible TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS certifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(190) NOT NULL,
    issuer VARCHAR(190),
    year_label VARCHAR(50),
    status VARCHAR(50),
    url VARCHAR(500),
    asset_id INT NULL,
    visible TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    email VARCHAR(190) NOT NULL,
    company VARCHAR(190),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    emailed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS page_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    day DATE NOT NULL,
    kind VARCHAR(20) NOT NULL,
    visitor CHAR(24) NOT NULL,
    referrer VARCHAR(190),
    device VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_day_kind (day, kind)
  )`,
];

async function migrate() {
  for (const sql of SCHEMA) {
    await query(sql + ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
  }
}

module.exports = { getPool, query, one, migrate };
