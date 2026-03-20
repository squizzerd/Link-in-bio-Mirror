const { getPool, sql } = require('./db');

async function initializeDatabase() {
    try {
        const pool = await getPool();
        
        // Create table if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GridItems' and xtype='U')
            CREATE TABLE GridItems (
                id NVARCHAR(50) PRIMARY KEY,
                imageUrl NVARCHAR(MAX) NOT NULL,
                altText NVARCHAR(500) NOT NULL,
                linkUrl NVARCHAR(MAX),
                createdAt DATETIME DEFAULT GETUTCDATE(),
                updatedAt DATETIME DEFAULT GETUTCDATE(),
                displayOrder INT DEFAULT 0
            )
        `);
        
        console.log('GridItems table initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };
