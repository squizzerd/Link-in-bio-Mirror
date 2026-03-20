const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { getPool, closePool, sql } = require('./db');
const { initializeDatabase } = require('./initDb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database on startup
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// API Routes

// GET all grid items
app.get('/api/items', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM GridItems ORDER BY displayOrder ASC, createdAt ASC');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// GET single item
app.get('/api/items/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar(50), req.params.id)
            .query('SELECT * FROM GridItems WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// POST create new item
app.post('/api/items', async (req, res) => {
    try {
        const { imageUrl, altText, linkUrl } = req.body;
        
        if (!imageUrl || !altText) {
            return res.status(400).json({ error: 'imageUrl and altText are required' });
        }
        
        const id = uuidv4();
        const pool = await getPool();
        
        // Get the next display order
        const orderResult = await pool.request()
            .query('SELECT ISNULL(MAX(displayOrder), -1) + 1 AS nextOrder FROM GridItems');
        const displayOrder = orderResult.recordset[0].nextOrder;
        
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('imageUrl', sql.NVarChar(sql.MAX), imageUrl)
            .input('altText', sql.NVarChar(500), altText)
            .input('linkUrl', sql.NVarChar(sql.MAX), linkUrl || null)
            .input('displayOrder', sql.Int, displayOrder)
            .query(`
                INSERT INTO GridItems (id, imageUrl, altText, linkUrl, displayOrder)
                VALUES (@id, @imageUrl, @altText, @linkUrl, @displayOrder)
            `);
        
        res.status(201).json({
            id,
            imageUrl,
            altText,
            linkUrl: linkUrl || null,
            displayOrder
        });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// PUT update item
app.put('/api/items/:id', async (req, res) => {
    try {
        const { imageUrl, altText, linkUrl } = req.body;
        const pool = await getPool();
        
        const result = await pool.request()
            .input('id', sql.NVarChar(50), req.params.id)
            .input('imageUrl', sql.NVarChar(sql.MAX), imageUrl)
            .input('altText', sql.NVarChar(500), altText)
            .input('linkUrl', sql.NVarChar(sql.MAX), linkUrl || null)
            .query(`
                UPDATE GridItems
                SET imageUrl = @imageUrl, altText = @altText, linkUrl = @linkUrl, updatedAt = GETUTCDATE()
                WHERE id = @id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ id: req.params.id, imageUrl, altText, linkUrl });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('id', sql.NVarChar(50), req.params.id)
            .query('DELETE FROM GridItems WHERE id = @id');
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// PUT reorder items
app.put('/api/items/reorder/batch', async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, displayOrder }
        const pool = await getPool();
        
        for (const item of items) {
            await pool.request()
                .input('id', sql.NVarChar(50), item.id)
                .input('displayOrder', sql.Int, item.displayOrder)
                .query('UPDATE GridItems SET displayOrder = @displayOrder WHERE id = @id');
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error reordering items:', error);
        res.status(500).json({ error: 'Failed to reorder items' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startServer();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await closePool();
    process.exit(0);
});
