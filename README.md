# Product Catalog Demo

Simple Node.js + React static product catalog. Run with:

1. npm install
2. npm start

Server runs on http://localhost:3000 and serves the React UI and /api/products.

Optional: Use Azure Cosmos DB for persistence
------------------------------------------------
This project supports using Azure Cosmos DB (NoSQL) when the following environment variables are set:

- COSMOS_ENDPOINT - the account URI (e.g. https://<account>.documents.azure.com:443/)
- COSMOS_KEY - primary key for the account (use Key Vault/managed identity in prod)
- COSMOS_DATABASE - optional database id (default: vibeodedemo-db)
- COSMOS_CONTAINER - optional container id (default: products)

If Cosmos env vars are not set the app falls back to the local JSON file at `data/products.json`.

Cosmos DB data modeling & partition key guidance
------------------------------------------------
Recommendations for long-term scale and best practices when moving from a JSON file to Cosmos DB:

- Partition key choice: pick a high-cardinality value that aligns with your primary query patterns.
	- Good options for this dataset: `category`, `tenantId`, or `ownerId` when multi-tenant.
	- Avoid low-cardinality keys (like `status` or `price-range`) which create hot partitions.

- Data shape: embed related fields that are frequently read together to avoid cross-partition queries.
	- For example, include `images` (array), `price`, `title`, `description` within each product item.
	- Keep each item < 2 MB; if you expect very large descriptions or many reviews, store them in a separate container.

- Throughput and scaling:
	- Use autoscale or provisioned RUs based on workload. Monitor 429s and implement retry-after logic.
	- Use multi-region writes for global low-latency scenarios.

- Indexing & queries:
	- Define custom indexing policy to exclude large unused properties to reduce RU costs.
	- Parameterize queries and avoid SELECT * in high-traffic endpoints.

- Connection handling:
	- Reuse a singleton `CosmosClient` instance across the app (this code initializes lazily).
	- Enable SDK retries and prefer async APIs.

- Security:
	- Do not hardcode keys. Use Managed Identity when running in Azure or store keys in Key Vault.
	- Use least-privilege roles for automation/service principals.

References
- Azure Cosmos DB SDK for JavaScript: https://learn.microsoft.com/azure/cosmos-db/sql-api-sdk-node

Local emulator quick-start
-------------------------
To run and test locally with the Azure Cosmos DB Emulator (recommended for development):

1. Install and start the emulator (Windows installer or Docker image). By default the emulator exposes:

	- Endpoint: https://localhost:8081/
	- Key: C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==

2. You can run the demo app without setting env vars; it will use the emulator defaults and create the database/container automatically.

3. If you prefer to set env vars manually (PowerShell):

```powershell
$env:COSMOS_ENDPOINT = 'https://localhost:8081/'
$env:COSMOS_KEY = 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=='
npm start
```

TLS note (demo only): the emulator uses a self-signed certificate. For local development the code disables strict TLS verification so you don't need to import the certificate; DO NOT use this in production.


