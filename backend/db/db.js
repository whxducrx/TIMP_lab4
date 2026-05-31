// db/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

pool.on('error', (err) => {
    console.error('error', err);
    process.exit(-1);
});

async function connectDatabase() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('connect to db success');
        return true;
    } catch (error) {
        console.error('error to connect db:', error.message);
        throw error;
    }
}

async function query(text, params) {
    try {
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        console.error('SQL Error:', error);
        throw error;
    }
}

async function getOne(text, params) {
    const result = await query(text, params);
    return result.rows[0];
}

async function getAll(text, params) {
    const result = await query(text, params);
    return result.rows;
}

async function closePool() {
    await pool.end();
    console.log('Подключение к БД закрыто');
}

module.exports = {
    pool,
    query,
    getOne,
    getAll,
    connectDatabase,
    closePool,
};
