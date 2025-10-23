# Azure Cosmos DB with Entra ID Authentication Setup Guide

This guide explains how to configure Azure Cosmos DB with Entra ID (Azure AD) authentication for secure, keyless access to your database.

## Prerequisites

- Azure CLI installed and configured
- Access to Azure Portal
- Appropriate permissions in your Azure subscription
- Node.js application with Azure Cosmos DB SDK

## Step 1: Azure Authentication

Ensure you're logged into Azure CLI:

```bash
az login
# Select the appropriate subscription if you have multiple
az account set --subscription "<your-subscription-id>"
```

## Step 2: Get Your User Information

Retrieve your user object ID (needed for role assignments):

```bash
# Get your current user's object ID
az ad signed-in-user show --query id -o tsv
```

## Step 3: Configure Cosmos DB Firewall

Add your current public IP address to the Cosmos DB firewall:

```bash
# Add your IP to the firewall (replace with actual values)
az cosmosdb update \
  --name "<cosmos-db-account-name>" \
  --resource-group "<resource-group-name>" \
  --ip-range-filter "<your-public-ip>"
```

## Step 4: Assign RBAC Roles

### Option A: Using Azure CLI (Recommended)

```bash
# Set variables for easier management
SUBSCRIPTION_ID="<your-subscription-id>"
RESOURCE_GROUP="<your-resource-group>"
COSMOS_ACCOUNT="<your-cosmos-account-name>"
USER_EMAIL="<your-email@domain.com>"
USER_OBJECT_ID="<your-user-object-id>"

# Assign Cosmos DB SQL role assignments for data access
az cosmosdb sql role assignment create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --subscription "$SUBSCRIPTION_ID" \
  --scope "/" \
  --principal-id "$USER_OBJECT_ID" \
  --role-definition-id "00000000-0000-0000-0000-000000000002"  # Data Contributor

az cosmosdb sql role assignment create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --subscription "$SUBSCRIPTION_ID" \
  --scope "/" \
  --principal-id "$USER_OBJECT_ID" \
  --role-definition-id "00000000-0000-0000-0000-000000000001"  # Data Reader

# Assign management-plane roles
az role assignment create \
  --assignee "$USER_EMAIL" \
  --role "DocumentDB Account Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/$COSMOS_ACCOUNT"

az role assignment create \
  --assignee "$USER_EMAIL" \
  --role "Cosmos DB Operator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/$COSMOS_ACCOUNT"

az role assignment create \
  --assignee "$USER_EMAIL" \
  --role "Cosmos DB Account Reader Role" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/$COSMOS_ACCOUNT"
```

### Option B: Using Azure Portal

1. Navigate to your Cosmos DB account in Azure Portal
2. Go to **Data Explorer** → Look for RBAC permission prompts
3. Click **"Add role assignment"** or **"Enable RBAC"**
4. Select **"Cosmos DB Built-in Data Contributor"** role
5. Add your user account
6. Go to **Access Control (IAM)**
7. Add role assignment for **"DocumentDB Account Contributor"**

## Step 5: Create Database and Container

Create the required database and container:

```bash
# Create database
az cosmosdb sql database create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --name "<your-database-name>"

# Create container with partition key
az cosmosdb sql container create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --database-name "<your-database-name>" \
  --name "<your-container-name>" \
  --partition-key-path "/<your-partition-key>"
```

## Step 6: Update Application Code

### Install Required Dependencies

```bash
npm install @azure/identity @azure/cosmos
```

### Update Database Connection Code

```javascript
const { AzureCliCredential } = require('@azure/identity');
const { CosmosClient } = require('@azure/cosmos');

async function initCosmos() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  
  if (endpoint.includes('localhost')) {
    // Local emulator - use key-based auth
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    cosmosClient = new CosmosClient({ endpoint, key });
  } else {
    // Cloud Cosmos DB - use Entra ID authentication
    const credential = new AzureCliCredential();
    cosmosClient = new CosmosClient({ endpoint, aadCredentials: credential });
  }
  
  // Initialize database and container
  const { database } = await cosmosClient.databases.createIfNotExists({ 
    id: databaseId 
  });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: [partitionKeyPath], kind: 'Hash' },
  });
  
  cosmosContainer = container;
}
```

## Step 7: Environment Configuration

Update your `.env` file for Entra ID authentication:

```env
# Azure Cosmos DB Configuration with Entra ID
COSMOS_ENDPOINT=https://<your-cosmos-account>.documents.azure.com:443/
# Note: No COSMOS_KEY needed when using Entra ID authentication
COSMOS_DATABASE=<your-database-name>
COSMOS_CONTAINER=<your-container-name>
COSMOS_PARTITION_KEY=/<your-partition-key-field>
```

## Step 8: Testing the Setup

### Test Azure CLI Authentication
```bash
# Verify you can get a Cosmos DB token
az account get-access-token --resource https://cosmos.azure.com
```

### Test Application Connection
Run your application and verify it connects without key-based authentication:

```bash
npm start
```

Look for logs indicating successful Cosmos DB connection without fallback to local storage.

## Troubleshooting

### Common Issues and Solutions

**Issue**: "Request blocked by Auth" errors
- **Solution**: Wait 15-30 minutes for role assignments to propagate
- **Alternative**: Try refreshing Azure CLI token: `az account clear && az login`

**Issue**: "Request originated from IP... blocked by firewall"
- **Solution**: Add your public IP to Cosmos DB firewall settings
- **Check IP**: Use `curl ifconfig.me` or check Azure Portal notification

**Issue**: Data Explorer works but application doesn't
- **Solution**: Ensure database and container exist before running application
- **Solution**: Use `AzureCliCredential` instead of `DefaultAzureCredential`

**Issue**: Permission propagation delays
- **Solution**: Role assignments can take up to 30 minutes to fully propagate
- **Workaround**: Create database/container via CLI first

### Verification Steps

1. **Portal Access**: Verify you can access Data Explorer in Azure Portal
2. **CLI Access**: Run database/container creation commands successfully  
3. **Application**: Application connects without authentication errors
4. **Data Operations**: Can read/write data through your application

## Role Definitions Reference

| Role | ID | Description |
|------|----|-----------| 
| Cosmos DB Built-in Data Reader | `00000000-0000-0000-0000-000000000001` | Read access to data |
| Cosmos DB Built-in Data Contributor | `00000000-0000-0000-0000-000000000002` | Read/write access to data |
| DocumentDB Account Contributor | `5bd9cd88-fe45-4216-938b-f97437e15450` | Manage account settings |
| Cosmos DB Account Reader Role | `fbdf93bf-df7d-467e-a4d2-9458aa1360c8` | Read account metadata |
| Cosmos DB Operator | `230815da-be43-4aae-9cb4-875f7bd000aa` | Manage non-data operations |

## Security Best Practices

- ✅ **Use Entra ID authentication** instead of connection strings in production
- ✅ **Limit IP access** through firewall rules
- ✅ **Apply principle of least privilege** - only assign necessary roles
- ✅ **Regularly audit role assignments** and remove unused permissions
- ✅ **Use managed identities** in production environments when possible
- ✅ **Monitor access patterns** through Azure Monitor and diagnostic logs

## Additional Resources

- [Azure Cosmos DB RBAC Documentation](https://docs.microsoft.com/azure/cosmos-db/how-to-setup-rbac)
- [Azure Identity SDK Documentation](https://docs.microsoft.com/javascript/api/@azure/identity/)
- [Cosmos DB Security Best Practices](https://docs.microsoft.com/azure/cosmos-db/database-security)