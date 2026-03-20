const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_UID,
            password: process.env.DB_PWD
        }
    },
    options: {
        encrypt: true,
        trustServerCertificate: true,
        port: parseInt(process.env.DB_PORT) || 1433
    }
};

let pool = null;

async function getPool() {
    if (!pool) {
        pool = new sql.ConnectionPool(config);
        await pool.connect();
        console.log('Connected to SQL Server');
    }
    return pool;
}

async function closePool() {
    if (pool) {
        await pool.close();
        pool = null;
    }
}

module.exports = {
    getPool,
    closePool,
    sql
};
