const { Pool } = require('pg');

const pool = new Pool({
    host: "postgres",
    user: "user1",
    database: "db",
    password: "pass",
    port: 5432,
});

const connectWithRetry = async () => {
    let attempts = 5;
    while (attempts > 0) {
        try {
            await pool.connect();
            console.log("Connected to PostgreSQL successfully!");
            return;
        } catch (err) {
            console.error("Failed to connect to PostgreSQL, retrying...", err);
            attempts--;
            await new Promise(res => setTimeout(res, 5000)); // Wait for 5 seconds before retrying
        }
    }
    console.error("Could not connect to PostgreSQL after multiple attempts.");
};

connectWithRetry();

module.exports = pool;
