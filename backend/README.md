# CM Backend

Simple Express + MongoDB Atlas API for the CM app.  
Designed to run on **Azure App Service Free tier (F1)** – 60 CPU minutes/day.

---

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/health` | Health-check |
| GET | `/api/state` | Returns full state (`teams`, `playerOwners`, `rules`) |
| PUT | `/api/state/teams` | Replace teams array |
| PUT | `/api/state/player-owners` | Replace playerOwners map |
| PUT | `/api/state/rules` | Replace rules array |

---

## Local development

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Create your `.env` file
```bash
cp .env.example .env
# then edit .env and fill in MONGO_URI
```

### 3. Run in dev mode (auto-restart on changes)
```bash
npm run dev
```

The server starts on **http://localhost:3001**.

---

## MongoDB Atlas setup (free M0 cluster)

1. Go to https://cloud.mongodb.com and create a free account.
2. Create a **free M0 cluster** (512 MB – more than enough).
3. **Database Access** → Add a user with read/write permission.
4. **Network Access** → Add IP `0.0.0.0/0` (allow all) for Azure (or restrict to Azure outbound IPs).
5. Click **Connect → Drivers** and copy the connection string.
6. Paste it as `MONGO_URI` in your `.env` (and later in Azure App Settings).

---

## Deploy to Azure App Service (Free F1 tier)

### Pre-requisites
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and logged in (`az login`)
- OR use the [Azure App Service VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice)

### Option A – Azure CLI (one-time setup)

```bash
# From the backend/ folder

# 1. Create a resource group (skip if you already have one)
az group create --name cm-rg --location eastus

# 2. Create a free App Service plan
az appservice plan create \
  --name cm-plan \
  --resource-group cm-rg \
  --sku FREE \
  --is-linux

# 3. Create the web app (replace <unique-app-name> with something globally unique)
az webapp create \
  --name <unique-app-name> \
  --resource-group cm-rg \
  --plan cm-plan \
  --runtime "NODE:20-lts"

# 4. Set environment variables (App Settings)
az webapp config appsettings set \
  --name <unique-app-name> \
  --resource-group cm-rg \
  --settings \
    MONGO_URI="mongodb+srv://..." \
    FRONTEND_URL="https://your-frontend-url.com"

# 5. Deploy via zip
cd backend
zip -r deploy.zip . --exclude "node_modules/*" --exclude ".env"
az webapp deploy \
  --name <unique-app-name> \
  --resource-group cm-rg \
  --src-path deploy.zip \
  --type zip
```

Azure will run `npm install` and `npm start` automatically.

### Option B – VS Code extension (easiest)

1. Install the **Azure App Service** extension in VS Code.
2. Sign in to Azure from the extension sidebar.
3. Right-click the `backend/` folder → **Deploy to Web App...**.
4. Follow the wizard – choose **Free (F1)** pricing tier.
5. After deploy, go to **Application Settings** and add `MONGO_URI` and `FRONTEND_URL`.

---

## Important notes for Free tier

- The app **idles** after ~20 minutes of inactivity (F1 has no "Always On").  
  The first request after idle takes ~5-10 seconds (cold start).
- 60 CPU minutes/day is plenty for light usage – each request uses milliseconds.
- Free tier does **not** support custom domains with SSL. Use the `.azurewebsites.net` URL, or upgrade to **Basic (B1)** for SSL + custom domain.

---

## Connecting the frontend

Once deployed, update the frontend's `AppContext.jsx` to call the API instead of  
reading/writing `localStorage`. The backend URL will be:

```
https://<unique-app-name>.azurewebsites.net
```

Set it as `VITE_API_URL` in the frontend's `.env` file:
```
VITE_API_URL=https://<unique-app-name>.azurewebsites.net
```
