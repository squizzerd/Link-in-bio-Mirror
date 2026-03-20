## Quick Start Guide

Your **Link-in-bio-Mirror** application has been converted to a full-stack app with:
- **Frontend**: React-like HTML/CSS/JS (in `public/index.html`)
- **Backend**: Node.js/Express API (in `server.js`)
- **Database**: SQL Server (configured via `.env`)

### 1. Setup in 3 Steps

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Configure Database
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your SQL Server details:
```
DB_SERVER=localhost          # or your server name/IP
DB_DATABASE=gallery_db
DB_UID=your_username
DB_PWD=your_password
DB_PORT=1433
```

#### Step 3: Start the Server
```bash
npm start
```

Server runs at: **http://localhost:3000**

### 2. First Run

The app will:
1. ✅ Connect to your SQL Server
2. ✅ Automatically create the `GridItems` table
3. ✅ Serve the frontend at http://localhost:3000

### 3. How to Use

**Preview Mode** (default):
- View gallery grid
- Click any image to open its link in a new tab

**Edit Mode**:
- Click "Edit Mode" button
- Add/edit/delete gallery items
- Reorder items with Up/Down buttons
- All changes save to SQL Server automatically

**Share Link**:
- Click "Share Link" button
- Copy the generated URL
- Use this link in your social media bio or anywhere you want to display your gallery
- The link shows a clean, view-only version of your gallery

### 4. API Endpoints

From any application:
```bash
# Get all items
curl http://localhost:3000/api/items

# Create new item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "altText": "Image description",
    "linkUrl": "https://example.com"
  }'

# Delete item
curl -X DELETE http://localhost:3000/api/items/{id}
```

### 5. File Structure

```
project/
├── server.js          → Main Express server
├── db.js              → SQL Server connection
├── initDb.js          → Database initialization
├── package.json       → Dependencies
├── .env               → Configuration (don't commit!)
├── .env.example       → Template for .env
├── public/
│   └── index.html     → Frontend app
└── node_modules/      → Dependencies (auto-generated)
```

### 6. Development Tips

- **Auto-reload**: Use `npm run dev` (requires nodemon)
- **Database resets**: Delete and recreate the database
- **Debug**: Check server console logs for errors
- **CORS**: Already enabled for localhost

### 7. Production Deployment

Before deploying:
1. Create `.env` with production credentials
2. Use HTTPS
3. Implement authentication if needed
4. Add input validation
5. Set `NODE_ENV=production`

```bash
NODE_ENV=production npm start
```

### 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection failed | Check DB_SERVER, DB_UID, DB_PWD in .env |
| Table not created | Verify database exists and credentials work |
| Port 3000 in use | Change PORT in .env |
| Images not loading | Verify image URLs are valid |
| Can't add items | Check browser console and server logs |

### 9. Data Backup

```bash
# Export all items
# Click "Export" button in Edit Mode

# Backup to file (optional SQL backup)
# SQL Server: CREATE BACKUP DATABASE gallery_db ...
```

### 10. Next Steps

- ✅ Test adding/editing items
- ✅ Verify images display correctly
- ✅ Test direct link navigation
- ✅ Set up automatic backups
- ✅ Deploy to production server

---

**Questions?** Check the full README.md for detailed documentation.
