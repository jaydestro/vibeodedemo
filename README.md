# Product Catalog Demo

Simple Node.js + React static product catalog with Azure Cosmos DB integration.

## Quick Start Setup

### Prerequisites
• Install Node.js 18+
• Install Azure CLI: `winget install Microsoft.AzureCLI`
• Login to Azure: `az login`

### Basic Setup
• `npm install`
• Copy `.env.example` to `.env`
• Configure Cosmos DB (see options below)
• `npm start` → opens http://localhost:3000

### Seed Data
• `cd scripts`
• `node seed.js` → populates 3 sample products

## Cosmos DB Configuration Options

### Option 1: Entra ID Authentication (Recommended)

• Create Cosmos DB account in Azure Portal
• Set firewall to allow your IP or "Accept connections from within public Azure datacenters"
• In `.env` set:

- `COSMOS_ENDPOINT=https://YOUR-ACCOUNT.documents.azure.com:443/`
- Remove or comment out `COSMOS_KEY`

• Assign RBAC roles via Azure CLI:

```bash
az cosmosdb sql role assignment create \
  --account-name "YOUR-ACCOUNT" \
  --resource-group "YOUR-RG" \
  --scope "/" \
  --principal-id $(az ad signed-in-user show --query id -o tsv) \
  --role-definition-name "Cosmos DB Built-in Data Contributor"
```

• Configure VS Code Azure Cosmos DB extension to use Entra ID
• Wait 30+ minutes for role propagation

### Option 2: Local Emulator

• Install Azure Cosmos DB Emulator
• Start emulator (auto-creates endpoint/key)
• In `.env` set:

- `COSMOS_ENDPOINT=https://localhost:8081/`
- `COSMOS_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==`

### Option 3: Fallback to JSON

• Remove all COSMOS_* variables from `.env`
• App automatically uses `data/products.json`

## Troubleshooting

### Common Issues
• **"Request blocked by Auth"** → Check RBAC role assignments and wait for propagation
• **Connection timeout** → Verify firewall allows your IP address
• **Database/container not found** → Create via Azure Portal Data Explorer first
• **VS Code extension fails** → Set `azureDatabases.cosmosDB.preferredAuthenticationMethod` to `Entra Id`

### Verification Steps
• Test Azure Portal → Cosmos DB → Data Explorer (should work if permissions correct)
• Run seed script: `cd scripts && node seed.js`
• Check app logs for connection status at startup

## Architecture Notes

### Application Structure
• **Backend**: Node.js + Express server on port 3000
• **Database**: Azure Cosmos DB with JSON fallback
• **Frontend**: Static React app served from `/public`
• **API**: REST endpoints at `/api/products` and `/api/db-status`

### Database Abstraction
• **Connection**: Lazy initialization with singleton pattern
• **Authentication**: AzureCliCredential for Entra ID, fallback to key-based
• **Fallback**: Graceful degradation to local JSON when Cosmos unavailable
• **Auto-creation**: Database and container created automatically if missing

### File Structure
• `server.js` - Main Express application
• `db/index.js` - Database abstraction layer
• `scripts/seed.js` - Database seeding utility
• `data/products.json` - Fallback data source
• `public/` - Static React frontend files

## Production Considerations

### Cosmos DB Best Practices
• **Partition Key**: Choose high-cardinality field like `category` or `tenantId`
• **Data Modeling**: Embed related fields together, keep items under 2MB
• **Throughput**: Use autoscale RUs, monitor for 429 throttling
• **Security**: Use Managed Identity in Azure, never hardcode keys
• **Indexing**: Exclude large unused properties to reduce RU costs

### Security Checklist
• Enable firewall restrictions in Cosmos DB
• Use least-privilege RBAC roles
• Store secrets in Azure Key Vault
• Enable logging and monitoring
• Disable TLS bypass in production builds

## References

• [Azure Cosmos DB JavaScript SDK](https://learn.microsoft.com/azure/cosmos-db/sql-api-sdk-node)
• [Cosmos DB Best Practices](https://learn.microsoft.com/azure/well-architected/service-guides/cosmos-db)
• [Entra ID Authentication](https://learn.microsoft.com/azure/cosmos-db/how-to-setup-rbac)


