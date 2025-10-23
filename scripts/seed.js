const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'products.json');
  if (!fs.existsSync(dataPath)) {
    console.error('products.json not found at', dataPath);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Use the same DB layer so behavior is consistent
  const db = require('..//db');

  try {
    console.log(`Seeding ${products.length} products...`);
    const res = await db.updateAllProducts(products);
    console.log(`Seeded ${res.length} products.`);
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed:', e && e.message ? e.message : e);
    process.exit(2);
  }
}

main();
