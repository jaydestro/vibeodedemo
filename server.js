const path = require('path');
const fs = require('fs');
require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Use DB abstraction for products
const db = require('./db');
app.use(express.json());

// Initialize DB (Cosmos/emulator) at startup
db.init().then(() => {
  if (db.isCosmosEnabled()) {
    console.log('Using Cosmos DB at', db.getInfo().endpoint);
  } else {
    console.log('Cosmos not enabled — using local JSON file fallback');
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.json(products);
  } catch (e) {
    console.error('Failed to load products', e);
    res.status(500).json({ error: 'failed to load products' });
  }
});

app.get('/api/db-status', (req, res) => {
  res.json({ cosmosEnabled: db.isCosmosEnabled(), info: db.getInfo() });
});

// Bulk update endpoint: apply a discountPercent to all products
app.post('/api/products/update-all', async (req, res) => {
  const { discountPercent } = req.body || {};
  if (typeof discountPercent !== 'number' || isNaN(discountPercent)) {
    return res.status(400).json({ error: 'discountPercent must be a number' });
  }

  try {
    const products = await db.getAllProducts();
    const factor = 1 - discountPercent / 100;
    const updated = products.map((p) => ({ ...p, price: Math.round((p.price * factor) * 100) / 100 }));
    await db.updateAllProducts(updated);
    res.json({ success: true, updatedCount: updated.length });
  } catch (e) {
    console.error('Failed to update products', e);
    res.status(500).json({ error: 'failed to update products' });
  }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
