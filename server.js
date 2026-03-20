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

// View-only gallery (for social media bios)
app.get('/view', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM GridItems ORDER BY displayOrder ASC, createdAt ASC');
        
        const items = result.recordset;
        
        // Generate view-only HTML
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery Grid</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Work+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-background: #fafaf8;
            --color-surface: #ffffff;
            --color-text-primary: #1a1a1a;
            --color-text-secondary: #6b6b6b;
            --color-border: #e8e8e6;
            --color-accent: #2d2d2d;
            --color-hover: #f5f5f3;
            --spacing-unit: 8px;
            --grid-gap: 4px;
            --transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
            --font-display: 'Cormorant Garamond', serif;
            --font-body: 'Work Sans', sans-serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-body);
            background-color: var(--color-background);
            color: var(--color-text-primary);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .header {
            background-color: var(--color-surface);
            border-bottom: 1px solid var(--color-border);
            padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4);
            text-align: center;
        }

        .logo {
            font-family: var(--font-display);
            font-size: 32px;
            font-weight: 300;
            letter-spacing: 0.02em;
            color: var(--color-text-primary);
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: calc(var(--spacing-unit) * 4);
        }

        .grid-container {
            opacity: 0;
            animation: fadeIn 0.6s var(--transition-smooth) forwards;
            animation-delay: 0.1s;
        }

        @keyframes fadeIn {
            to {
                opacity: 1;
            }
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--grid-gap);
            margin-bottom: calc(var(--spacing-unit) * 6);
        }

        .grid-item {
            position: relative;
            aspect-ratio: 1;
            overflow: hidden;
            background: var(--color-surface);
            cursor: pointer;
            animation: scaleIn 0.5s var(--transition-smooth) backwards;
        }

        .grid-item:nth-child(1) { animation-delay: 0.05s; }
        .grid-item:nth-child(2) { animation-delay: 0.1s; }
        .grid-item:nth-child(3) { animation-delay: 0.15s; }
        .grid-item:nth-child(4) { animation-delay: 0.2s; }
        .grid-item:nth-child(5) { animation-delay: 0.25s; }
        .grid-item:nth-child(6) { animation-delay: 0.3s; }

        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        .grid-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s var(--transition-smooth);
        }

        .grid-item:hover img {
            transform: scale(1.05);
        }

        .grid-item-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 50%);
            opacity: 0;
            transition: opacity 0.4s var(--transition-smooth);
            display: flex;
            align-items: flex-end;
            padding: calc(var(--spacing-unit) * 2);
        }

        .grid-item:hover .grid-item-overlay {
            opacity: 1;
        }

        .grid-item-link-icon {
            width: 20px;
            height: 20px;
            stroke: white;
            stroke-width: 2;
            fill: none;
        }

        .empty-state {
            text-align: center;
            padding: calc(var(--spacing-unit) * 10) calc(var(--spacing-unit) * 4);
        }

        .empty-state-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto calc(var(--spacing-unit) * 3);
            opacity: 0.3;
        }

        .empty-state-title {
            font-family: var(--font-display);
            font-size: 32px;
            font-weight: 300;
            margin-bottom: calc(var(--spacing-unit) * 2);
        }

        .empty-state-text {
            color: var(--color-text-secondary);
            margin-bottom: calc(var(--spacing-unit) * 4);
        }

        @media (max-width: 1024px) {
            .grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 640px) {
            .grid {
                grid-template-columns: 1fr;
            }

            .container {
                padding: calc(var(--spacing-unit) * 2);
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1 class="logo">Gallery Grid</h1>
    </header>

    <main class="container">
        <div class="grid-container">
            <div class="grid" id="grid">
                ${items.length === 0 ? `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
                            <circle cx="9" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <h2 class="empty-state-title">No Images Yet</h2>
                        <p class="empty-state-text">Gallery is empty</p>
                    </div>
                ` : items.map((item, index) => `
                    <div class="grid-item" style="animation-delay: ${(index % 6) * 0.05}s">
                        <img src="${item.imageUrl}" alt="${item.altText}" loading="${index < 6 ? 'eager' : 'lazy'}">
                        <div class="grid-item-overlay">
                            <svg class="grid-item-link-icon" viewBox="0 0 24 24">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </main>

    <script>
        // Add click handlers for navigation
        document.querySelectorAll('.grid-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const items = ${JSON.stringify(items)};
                const itemData = items[index];
                if (itemData && itemData.linkUrl) {
                    window.open(itemData.linkUrl, '_blank', 'noopener,noreferrer');
                }
            });
        });
    </script>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error generating view-only gallery:', error);
        res.status(500).send('Error loading gallery');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
    startServer();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await closePool();
    process.exit(0);
});
