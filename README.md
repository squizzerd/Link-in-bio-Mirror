# Grid Gallery - Full Stack App with SQL Server

A dynamic grid gallery application with a Node.js/Express backend and SQL Server database. Features direct image-to-link navigation with admin panel for managing gallery items.

## Project Structure

```
Link-in-bio-Mirror/
├── server.js              # Express server and API endpoints
├── db.js                  # SQL Server connection config
├── initDb.js              # Database schema initialization
├── package.json           # Node.js dependencies
├── .env.example           # Environment variables template
├── .env                   # (Create this with your config)
├── public/
│   └── index.html         # Frontend application
└── README.md              # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQL Server (Local or Remote)
- Database with connection credentials

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your SQL Server credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_SERVER=your_server_name_or_ip
DB_DATABASE=gallery_db
DB_UID=your_username
DB_PWD=your_password
DB_PORT=1433
PORT=3000
```

### 3. Create Database (Optional)

If the database doesn't exist:
```sql
CREATE DATABASE gallery_db;
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Access the app at http://localhost:3000

## Features

- **Preview Mode**: Click images to open destination links directly
- **Edit Mode**: Add, update, delete, and reorder gallery items
- **SQL Server Backend**: All data persisted in database
- **RESTful API**: Full CRUD operations
- **Export/Import**: Backup and restore gallery data as JSON
- **Responsive Design**: Works on all devices

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/items` | Get all items |
| GET | `/api/items/:id` | Get single item |
| POST | `/api/items` | Create new item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| GET | `/api/health` | Health check |

## Database Schema

```sql
CREATE TABLE GridItems (
    id NVARCHAR(50) PRIMARY KEY,
    imageUrl NVARCHAR(MAX) NOT NULL,
    altText NVARCHAR(500) NOT NULL,
    linkUrl NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    displayOrder INT DEFAULT 0
)
```

## Usage

1. Open http://localhost:3000
2. Click "Edit Mode" to add and manage gallery items
3. In Preview Mode, click images to navigate to their links
4. Use Export/Import for data backup and restore

## Troubleshooting

- **Connection Failed**: Verify SQL Server is running and credentials are correct
- **Port in Use**: Change PORT in `.env` file
- **Database Table Not Created**: Check `.env` credentials and restart server
- **Images Not Loading**: Verify image URLs are valid and accessible

## Link-in-bio-Mirror
