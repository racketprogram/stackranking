const pool = require('../config/database');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    apple INT DEFAULT 0,
    banana INT DEFAULT 0,
    kiwi INT DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

(async () => {
  try {
    await pool.query(createTableQuery);
    console.log("Table 'users' created successfully!");
  } catch (err) {
    console.error("Error creating table 'users':", err);
  } finally {
    pool.end();
  }
})();
