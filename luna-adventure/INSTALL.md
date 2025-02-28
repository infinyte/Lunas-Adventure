# Installation Guide for Luna's Adventure

This guide provides detailed instructions for setting up and running Luna's Adventure on your local machine for both development and gameplay purposes.

## System Requirements

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **Web Browser**: Modern browser with ES6 and SVG support (Chrome, Firefox, Safari, Edge)
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **Disk Space**: At least 200MB of free space
- **Memory**: 2GB RAM minimum (4GB recommended)

## Basic Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/lunas-adventure.git
cd lunas-adventure
```

### Step 2: Install Dependencies

```bash
npm install
```

This command will install all necessary dependencies for both the server and client parts of the application.

### Step 3: Start the Development Server

```bash
npm run dev
```

This will start both the backend server and the frontend development environment with hot-reloading enabled.

### Step 4: Access the Game

Open your web browser and navigate to:

```
http://localhost:3000
```

You should now see the Luna's Adventure start screen and be able to play the game locally.

## Docker Installation

If you prefer to use Docker, we provide a Docker Compose setup for easy deployment.

### Prerequisites

- Docker Engine (20.10+)
- Docker Compose V2

### Running with Docker Compose

```bash
# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the containers
docker-compose down
```

The game will be accessible at `http://localhost:3000` after the containers have started.

## Azure Deployment

Luna's Adventure can be easily deployed to Azure using the provided configuration.

### Prerequisites

- Azure CLI installed and configured
- Azure account with active subscription

### Deployment Steps

1. **Login to Azure**

```bash
az login
```

2. **Create a Resource Group**

```bash
az group create --name LunasAdventureGroup --location eastus
```

3. **Deploy the Container App**

```bash
az containerapp up \
  --name lunas-adventure \
  --resource-group LunasAdventureGroup \
  --location eastus \
  --environment LunasAdventureEnv \
  --source .
```

4. **Access Your Deployed Application**

Once deployment completes, you'll receive a URL where your application is accessible.

## Configuration Options

Luna's Adventure can be configured through environment variables or a `.env` file at the project root:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the server runs on | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `DB_PATH` | Path to store local high scores | `./data` |
| `ENABLE_MULTIPLAYER` | Enable multiplayer features | `true` |

Example `.env` file:

```
PORT=5000
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_MULTIPLAYER=false
```

## Development Setup

For those looking to develop and extend Luna's Adventure, here are some additional setup steps:

### Setting Up the Development Environment

1. **Install Development Dependencies**

```bash
npm install --also=dev
```

2. **Run Tests**

```bash
npm test
```

3. **Start with Debugging Enabled**

```bash
npm run dev:debug
```

This will start the server with Node.js inspector protocol enabled for debugging.

4. **Build for Production**

```bash
npm run build
```

This creates optimized assets in the `dist` directory.

### Code Style and Linting

We use ESLint and Prettier for code style enforcement:

```bash
# Run linter
npm run lint

# Fix automatic linting issues
npm run lint:fix
```

## Troubleshooting

### Common Issues

1. **"Address already in use" error**

The default port (3000) might be in use by another application. Change the PORT environment variable to use a different port.

2. **SVG rendering issues**

If you experience SVG rendering problems, ensure your browser is up to date. Some older browsers have limited SVG support.

3. **Socket.IO connection issues**

If multiplayer features aren't working, check your firewall settings to ensure WebSocket connections are allowed.

4. **NPM installation errors**

If you encounter npm errors during installation, try clearing the npm cache:

```bash
npm cache clean --force
npm install
```

### Getting Help

If you encounter issues not covered here:

1. Check our [GitHub Issues](https://github.com/yourusername/lunas-adventure/issues) to see if the problem has been reported
2. Ask for help in our [Discord community](https://discord.gg/example)
3. Submit a new issue with detailed information about the problem, including:
   - Operating system and version
   - Browser type and version
   - Node.js and npm versions
   - Error messages and logs
   - Steps to reproduce the issue

## Updating

To update Luna's Adventure to the latest version:

```bash
git pull
npm install
npm run build
```

This will fetch the latest code, install any new dependencies, and rebuild the application.

---

Enjoy playing and developing Luna's Adventure! If you have suggestions for improving this installation guide, please let us know.