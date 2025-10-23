# Product Catalog Demo

A simple Node.js + React product catalog built from this prompt:

> **Prompt:** "let's build a simple Node.js + React product catalog; seed with a few sample products in JSON files."

## What This App Does

• **Backend**: Express.js server serving a REST API
• **Frontend**: React app (via CDN) with product grid display  
• **Data**: Products stored in `data/products.json` file
• **Features**: View products, apply bulk discount to all items

## Quick Start

```bash
npm install
npm start
# Opens http://localhost:3000
```

## How to Replicate This App

Use this prompt in VS Code with GitHub Copilot:

```
open VS Code → create/open new folder: vibedemo
prompt: "let's build a simple Node.js + React product catalog; seed with a few sample products in JSON files."
```

### Expected Result

• Express.js server with REST API endpoints
• React frontend (loaded via CDN for simplicity)  
• Sample products in JSON file
• Product grid display with images and prices
• Bulk discount feature that updates all products

## Project Structure

```
vibeodedemo/
├── server.js              # Express server with API routes  
├── package.json           # Node.js dependencies (just express)
├── data/
│   └── products.json      # Sample product data (3 items)
└── public/
    ├── index.html         # React app entry point
    ├── app.js            # React components (vanilla JS) 
    └── styles.css        # Basic styling
```

## API Endpoints

• **GET /api/products** - Returns all products from JSON file
• **POST /api/products/update-all** - Applies discount % to all product prices

## Sample Data

The app includes 3 sample products:
• Acoustic Guitar ($95.65)
• Wireless Headphones ($43.05) 
• Portable Speaker ($23.91)

## Key Features

• **Simple Setup**: No database required - uses local JSON file
• **React via CDN**: No build step needed, React loaded from unpkg.com
• **Vanilla JS Components**: Uses React.createElement instead of JSX
• **File-based Storage**: Products persist in `data/products.json`
• **Bulk Operations**: Apply discounts to all products at once

## Extending the App

This simple structure makes it easy to:
• Add more products to `data/products.json`
• Create new API endpoints in `server.js`
• Add React components in `public/app.js`
• Style with CSS in `public/styles.css`

Perfect starting point for learning Node.js + React or building a product catalog prototype!
