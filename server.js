const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Simple API to return products from JSON file
app.get('/api/products', (req, res) => {
  const dataPath = path.join(__dirname, 'data', 'products.json');
  fs.readFile(dataPath, 'utf8', (err, raw) => {
    if (err) {
      console.error('Error reading products file', err);
      return res.status(500).json({ error: 'failed to load products' });
    }
    try {
      const products = JSON.parse(raw);
      res.json(products);
    } catch (e) {
      console.error('Invalid JSON in products file', e);
      res.status(500).json({ error: 'invalid products data' });
    }
  });
});

// Bulk update endpoint: apply a discountPercent to all products
app.use(express.json());
app.post('/api/products/update-all', (req, res) => {
  const { discountPercent } = req.body || {};
  if (typeof discountPercent !== 'number' || isNaN(discountPercent)) {
    return res.status(400).json({ error: 'discountPercent must be a number' });
  }

  const dataPath = path.join(__dirname, 'data', 'products.json');
  fs.readFile(dataPath, 'utf8', (err, raw) => {
    if (err) {
      console.error('Error reading products file', err);
      return res.status(500).json({ error: 'failed to load products' });
    }
    let products;
    try {
      products = JSON.parse(raw);
    } catch (e) {
      console.error('Invalid JSON in products file', e);
      return res.status(500).json({ error: 'invalid products data' });
    }

    // Apply discount
    const factor = 1 - discountPercent / 100;
    const updated = products.map((p) => ({ ...p, price: Math.round((p.price * factor) * 100) / 100 }));

    fs.writeFile(dataPath, JSON.stringify(updated, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Failed to write products file', err);
        return res.status(500).json({ error: 'failed to write products' });
      }
      res.json({ success: true, updatedCount: updated.length });
    });
  });
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
