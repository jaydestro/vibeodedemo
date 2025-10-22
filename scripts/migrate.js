const fs = require('fs');
const path = require('path');

async function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'products.json');
  if (!fs.existsSync(dataPath)) {
    console.error('products.json not found at', dataPath);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  let CosmosClient;
  try {
    ({ CosmosClient } = require('@azure/cosmos'));
  } catch (err) {
    console.error('@azure/cosmos is required to run migration. Install with: npm install @azure/cosmos');
    process.exit(2);
  }

  // Defaults for emulator
  const EMULATOR_ENDPOINT = 'https://localhost:8081/';
  const EMULATOR_KEY =
    'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';

  const endpoint = process.env.COSMOS_ENDPOINT || EMULATOR_ENDPOINT;
  const key = process.env.COSMOS_KEY || EMULATOR_KEY;
  const databaseId = process.env.COSMOS_DATABASE || 'vibeodedemo-db';
  const containerId = process.env.COSMOS_CONTAINER || 'products';
  const partitionKeyPath = process.env.COSMOS_PARTITION_KEY || '/category';
  const partitionKeyProp = partitionKeyPath.replace(/^\//, '');

  // Allow local demo without certs
  if (!process.env.COSMOS_ENDPOINT) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const client = new CosmosClient({ endpoint, key });

  try {
    console.log('Ensuring database & container exist...');
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKeyPath], kind: 'Hash' },
    });

    console.log('Deleting existing items from container (this may take a moment)...');
    // Query all items and delete them one by one (must provide partition key value)
    const iterator = container.items.query({ query: 'SELECT * FROM c' });
    const { resources } = await iterator.fetchAll();
    for (const item of resources) {
      const id = item.id;
      const pk = item[partitionKeyProp];
      try {
        await container.item(id, pk).delete();
      } catch (e) {
        // log and continue
        console.warn(`Failed to delete item id=${id} pk=${pk}:`, e.message || e);
      }
    }

    console.log(`Upserting ${products.length} products...`);
    for (const p of products) {
      // Ensure partition key property exists on each item
      if (p[partitionKeyProp] === undefined) p[partitionKeyProp] = p.category || 'default';
      await container.items.upsert(p);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e && e.message ? e.message : e);
    process.exit(3);
  }
}

main();
