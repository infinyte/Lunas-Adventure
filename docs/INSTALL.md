# Installation Guide for Luna's Adventure

## System Requirements

### Minimum
- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **Browser**: Chrome, Firefox, Safari, or Edge with ES6 and SVG support
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **Disk**: 200MB free space

### Recommended
- **Node.js**: v18.x or higher (CI uses Node 20)
- **Browser**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/infinyte/Lunas-Adventure.git
cd Lunas-Adventure
```

### Step 2: Install Dependencies

```bash
HUSKY=0 npm install
```

> **Note**: `HUSKY=0` is required because the `.git` directory is in the parent folder, not in the project root. Without it, the husky `prepare` hook will fail with a "not a git repository" error.

### Step 3: Configure Environment (Optional)

Create a `.env` file in the project root:

```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_MULTIPLAYER=true
```

If no `.env` file is present, defaults are used (port 3000).

### Step 4: Initialize the Database (Optional)

If you want high score persistence:

```bash
npm run db:init
```

### Step 5: Start the Development Server

```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:3000` (with nodemon, auto-restart)
- Frontend dev server on `http://localhost:8080` (with light-server + hot-reload)

Open `http://localhost:8080` in your browser to play.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server and client dev servers |
| `npm run server:dev` | Start server only (nodemon, auto-restart) |
| `npm run client:dev` | Start client only (light-server, port 8080) |
| `npm start` | Start production server |
| `npm test` | Run all tests with coverage |
| `npm run server:test` | Run server tests only |
| `npm run client:test` | Run client tests only |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run build` | Build client to `dist/` and optimize assets |
| `npm run db:init` | Initialize SQLite database |
| `npm run build:assets` | Rebuild SVG assets |
| `npm run validate` | Validate required game files are present |
| `npm run diagnostics` | Check file presence and system info |

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Log verbosity (`error`, `warn`, `info`, `debug`) | `info` |
| `ENABLE_MULTIPLAYER` | Enable Socket.IO multiplayer | `true` |

## Docker Installation

### Prerequisites
- Docker Engine 20.10+
- Docker Compose V2

### Steps

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Azure Deployment

### Azure Container Apps

```bash
az group create --name LunasAdventureGroup --location eastus

az containerapp env create \
  --name LunasAdventureEnv \
  --resource-group LunasAdventureGroup \
  --location eastus

az containerapp up \
  --name lunas-adventure \
  --resource-group LunasAdventureGroup \
  --location eastus \
  --environment LunasAdventureEnv \
  --source .
```

Set environment variables in the Azure Portal under Configuration:
- `PORT`: `8080`
- `NODE_ENV`: `production`

## Troubleshooting

### `npm install` fails with husky error
Use `HUSKY=0 npm install` (see Step 2 above).

### `Address already in use` (port 3000)
```bash
PORT=3001 npm run dev
```

### Node.js build tool errors (`node-gyp`)

**Windows:**
```bash
npm install --global --production windows-build-tools
```

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install build-essential python3
```

### Enable debug logging
```bash
LOG_LEVEL=debug npm run dev
```

### Check files are valid
```bash
npm run validate
```

## Updating

```bash
git pull
HUSKY=0 npm ci
npm run build
```

## Uninstalling

```bash
cd ..
rm -rf lunas-adventure
```
