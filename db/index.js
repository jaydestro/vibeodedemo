const fs = require('fs');
const path = require('path');

// Try to load Cosmos client lazily if configured. For local development we
// default to the Cosmos DB emulator credentials (endpoint + key) so the
// developer doesn't need to set env vars when using the emulator.
let cosmosClient = null;
let cosmosContainer = null;
let _endpoint = null;
let _databaseId = null;
let _containerId = null;
let _partitionKeyPath = null;

async function initCosmos() {
  if (cosmosClient) return;
  let CosmosClient;
  try {
    ({ CosmosClient } = require('@azure/cosmos'));
  } catch (err) {
    // SDK not installed or unavailable. Fall back to JSON, but provide
    // a clear message so the developer can install the package.
    console.warn(
      "@azure/cosmos module not found. To enable emulator/Cosmos support run: npm install @azure/cosmos"
    );
    return; // leave cosmosClient null so fallback to JSON is used
  }

  // Defaults for the Azure Cosmos DB Emulator
  const EMULATOR_ENDPOINT = 'https://localhost:8081/';
  const EMULATOR_KEY =
    'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';

  // Use provided env vars, otherwise fall back to emulator (for local dev/demo)
  const endpoint = process.env.COSMOS_ENDPOINT || EMULATOR_ENDPOINT;
  const key = process.env.COSMOS_KEY || EMULATOR_KEY;
  const databaseId = process.env.COSMOS_DATABASE || 'vibeodedemo-db';
  const containerId = process.env.COSMOS_CONTAINER || 'products';
  const partitionKeyPath = process.env.COSMOS_PARTITION_KEY || '/category';

  // For local emulator demo we disable strict TLS verification to avoid
  // needing to import the emulator cert. This is ONLY for local development.
  if (!process.env.COSMOS_ENDPOINT) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }


  try {
  cosmosClient = new CosmosClient({ endpoint, key });

    // Ensure database & container exist. For production you should
    // provision resources separately and not create them on the fly.
    const { database } = await cosmosClient.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKeyPath], kind: 'Hash' },
    });

    cosmosContainer = container;

    // Store resolved config for status reporting
    _endpoint = endpoint;
    _databaseId = databaseId;
    _containerId = containerId;
    _partitionKeyPath = partitionKeyPath;
  } catch (e) {
    // If initialization fails, clear client so fallback to JSON will be used.
    console.error('Cosmos DB init failed, falling back to JSON file:', e.message || e);
    cosmosClient = null;
    cosmosContainer = null;
  }
}

// Public init wrapper
async function init() {
  await initCosmos();
}

function isCosmosEnabled() {
  return !!cosmosContainer;
}

function getInfo() {
  if (!cosmosContainer) return null;
  return {
    endpoint: _endpoint,
    databaseId: _databaseId,
    containerId: _containerId,
    partitionKeyPath: _partitionKeyPath,
  };
}

async function getAllProducts() {
  await initCosmos();
  if (cosmosContainer) {
    // Query all items (small demo). For production use paging and continuation tokens.
    const querySpec = { query: 'SELECT * FROM c' };
    const { resources } = await cosmosContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  // Fallback to JSON file
  const dataPath = path.join(__dirname, '..', 'data', 'products.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(raw);
}

async function updateAllProducts(updatedProducts) {
  await initCosmos();
  if (cosmosContainer) {
    // Upsert each item (batching recommended for production)
    const results = [];
    for (const p of updatedProducts) {
      // Ensure partition key property exists; this sample assumes partition key path is present in the document
      results.push((await cosmosContainer.items.upsert(p)).resource);
    }
    return results;
  }

  // Fallback: write to JSON file
  const dataPath = path.join(__dirname, '..', 'data', 'products.json');
  fs.writeFileSync(dataPath, JSON.stringify(updatedProducts, null, 2), 'utf8');
  return updatedProducts;
}

module.exports = { init, getAllProducts, updateAllProducts, isCosmosEnabled, getInfo };
