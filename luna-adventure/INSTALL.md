# Installation Guide for Luna's Adventure

This comprehensive guide provides detailed instructions for setting up and running Luna's Adventure on your local machine for both development and gameplay purposes.

## System Requirements

### Minimum Requirements
- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **Web Browser**: Modern browser with ES6 and SVG support (Chrome, Firefox, Safari, Edge)
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **Disk Space**: At least 200MB of free space
- **Memory**: 2GB RAM minimum

### Recommended Requirements
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Web Browser**: Chrome 90+, Firefox 90+, Safari 15+, or Edge 90+
- **Memory**: 4GB RAM or more
- **Graphics**: Any GPU with hardware acceleration
- **Internet Connection**: Broadband connection for multiplayer features

## Installation Methods

You can install Luna's Adventure using one of the following methods.

### Method 1: Basic Installation

#### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/lunas-adventure.git
cd lunas-adventure
```

#### Step 2: Install Dependencies

```bash
npm install
```

This command will install all necessary dependencies for both the server and client parts of the application.

#### Step 3: Configure the Environment

Create a `.env` file in the project root with the following settings:

```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_MULTIPLAYER=true
```

You can customize these values according to your preferences.

#### Step 4: Start the Development Server

```bash
npm run dev
```

This will start both the backend server and the frontend development environment with hot-reloading enabled.

#### Step 5: Access the Game

Open your web browser and navigate to:

```
http://localhost:3000
```

You should now see the Luna's Adventure start screen and be able to play the game locally.

### Method 2: Docker Installation

If you prefer using containers, you can use Docker for a more isolated and consistent environment.

#### Prerequisites

- Docker Engine (20.10+)
- Docker Compose V2

#### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/lunas-adventure.git
cd lunas-adventure
```

#### Step 2: Configure Environment Variables (Optional)

Create a `.env` file in the project root to override default settings:

```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_MULTIPLAYER=true
```

#### Step 3: Build and Run with Docker Compose

```bash
# Build and start the containers
docker compose up -d

# View logs
docker compose logs -f

# Stop the containers
docker compose down
```

The game will be accessible at `http://localhost:3000` after the containers have started.

### Method 3: Using the Installation Script

For convenience, you can use our installation script that automates the setup process.

#### Step 1: Download and Run the Setup Script

**Linux/macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/lunas-adventure/main/scripts/setup.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://raw.githubusercontent.com/yourusername/lunas-adventure/main/scripts/setup.ps1 | iex
```

The script will guide you through the installation process, asking for your preferences along the way.

## Azure Deployment

Luna's Adventure can be easily deployed to Azure using the provided configuration.

### Prerequisites

- Azure CLI installed and configured
- Azure account with active subscription
- Azure Static Web Apps CLI (optional, for local testing)

### Deployment Steps

#### Option 1: Using Azure Static Web Apps

1. **Login to Azure**

```bash
az login
```

2. **Create a Static Web App**

```bash
az staticwebapp create \
  --name lunas-adventure \
  --resource-group LunasAdventureGroup \
  --source https://github.com/yourusername/lunas-adventure \
  --location "East US" \
  --branch main \
  --app-artifact-location "client" \
  --api-artifact-location "server" \
  --login-with-github
```

3. **Configure Environment Variables**

Navigate to the Azure Portal, find your Static Web App, and set up the following environment variables in the Configuration section:

- `PORT`: 8080 (default for Azure Static Web Apps)
- `NODE_ENV`: production
- `LOG_LEVEL`: info
- `ENABLE_MULTIPLAYER`: true

#### Option 2: Using Azure Container Apps

1. **Create a Resource Group**

```bash
az group create --name LunasAdventureGroup --location eastus
```

2. **Create Container App Environment**

```bash
az containerapp env create \
  --name LunasAdventureEnv \
  --resource-group LunasAdventureGroup \
  --location eastus
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

## Development Setup

For those looking to develop and extend Luna's Adventure, here are some additional setup steps:

### Setting Up the Development Environment

1. **Install Development Dependencies**

```bash
npm install --also=dev
```

2. **Initialize the Database**

```bash
npm run db:init
```

This sets up the local database for storing high scores and game progress.

3. **Generate Assets (Optional)**

If you want to rebuild or modify game assets:

```bash
npm run build:assets
```

4. **Start with Debugging Enabled**

```bash
npm run dev:debug
```

This will start the server with Node.js inspector protocol enabled for debugging.

### Setting Up for Frontend Development

1. **Install Frontend Tools**

```bash
cd client
npm install -g sass
```

2. **Watch for CSS Changes**

```bash
npm run watch:css
```

This will automatically compile SCSS files to CSS when changes are detected.

3. **Run Tests**

```bash
npm test
```

### Setting Up for Backend Development

1. **Install Backend Development Tools**

```bash
cd server
npm install -g nodemon
```

2. **Start Server in Development Mode**

```bash
npm run server:dev
```

This will start the backend server with automatic restart on file changes.

## Configuration Options

Luna's Adventure can be configured through environment variables or a `.env` file at the project root:

| Variable | Description | Default | Valid Values |
|----------|-------------|---------|--------------|
| `PORT` | Port the server runs on | `3000` | Any valid port number |
| `NODE_ENV` | Environment | `development` | `development`, `production`, `test` |
| `LOG_LEVEL` | Logging verbosity | `info` | `error`, `warn`, `info`, `verbose`, `debug` |
| `DB_PATH` | Path to store local data | `./data` | Any valid directory path |
| `ENABLE_MULTIPLAYER` | Enable multiplayer features | `true` | `true`, `false` |
| `SOCKET_TRANSPORTS` | Socket.IO transport methods | `websocket,polling` | Comma-separated list of transports |
| `MAX_PLAYERS` | Maximum players per game room | `4` | Any positive integer |
| `PHYSICS_TICK_RATE` | Physics updates per second | `60` | 30-120 recommended |
| `ASSET_CACHE_MAX_AGE` | Browser cache duration for assets (seconds) | `86400` | Any positive integer |

You can create a custom environment file (like `.env.production`) and use it with:

```bash
NODE_ENV=production npm start --env-file=.env.production
```

## Progressive Web App Features

Luna's Adventure is designed as a Progressive Web App (PWA) with the following features:

### Offline Support

The game can be played entirely offline after the initial load. Game progress is saved locally and synced when an internet connection is available.

### Installation on Devices

Users can install Luna's Adventure on their devices for a native app-like experience:

- **Desktop**: Click the install icon in the browser's address bar
- **iOS**: Use Safari's "Add to Home Screen" option
- **Android**: Use Chrome's "Add to Home Screen" option or the installation prompt

### Update Process

When a new version of the game is available:

1. The service worker will detect the update
2. Users will be prompted to refresh for the new version
3. The update will be applied automatically on the next page load

## Troubleshooting

### Common Issues

#### Installation Problems

1. **"node-gyp rebuild" error during npm install**

This is usually related to missing build tools. Install the required development tools:

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

2. **"EACCES: permission denied" error**

This means npm doesn't have permission to write to the necessary directories:

```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) .
```

#### Startup Issues

1. **"Address already in use" error**

The default port (3000) might be in use by another application. Change the PORT environment variable to use a different port:

```bash
PORT=3001 npm run dev
```

2. **Socket.IO connection issues**

If multiplayer features aren't working, check your firewall settings to ensure WebSocket connections are allowed. You can also try forcing Socket.IO to use long-polling instead:

```
SOCKET_TRANSPORTS=polling npm run dev
```

#### Game Performance Issues

1. **Game runs slowly on mobile devices**

Lower the graphics settings in the game options menu or enable performance mode:

```
ENABLE_PERFORMANCE_MODE=true npm start
```

2. **SVG rendering problems**

If you experience SVG rendering issues, try switching to the canvas renderer:

```
RENDERER_TYPE=canvas npm start
```

### Diagnostic Tools

1. **Check system compatibility**

```bash
npm run diagnostics
```

This will check if your system meets the requirements for running Luna's Adventure.

2. **Validate game files**

```bash
npm run validate
```

This ensures all game files are present and not corrupted.

3. **Enable debug logs**

```bash
LOG_LEVEL=debug npm run dev
```

This increases log verbosity for troubleshooting.

### Getting Additional Help

If you encounter issues not covered here:

1. Check our [GitHub Issues](https://github.com/yourusername/lunas-adventure/issues) to see if the problem has been reported
2. Join our [Discord community](https://discord.gg/example) for real-time support
3. Submit a new issue with detailed information about the problem, including:
   - Operating system and version
   - Browser type and version
   - Node.js and npm versions
   - Error messages and logs
   - Steps to reproduce the issue

## Advanced Topics

### Security Considerations

By default, Luna's Adventure is configured with reasonable security settings. However, if you're deploying in a production environment, consider the following:

1. **Configure CORS properly**

Edit the `server/config/security.js` file to restrict allowed origins:

```javascript
corsOptions: {
  origin: ['https://yourdomain.com'],
  methods: ['GET', 'POST'],
  credentials: true
}
```

2. **Set up rate limiting**

Configure the rate limiter in `server/config/security.js`:

```javascript
rateLimit: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
}
```

3. **Enable HTTPS**

For production environments, always use HTTPS. You can configure it in your `.env` file:

```
ENABLE_HTTPS=true
SSL_KEY_PATH=path/to/key.pem
SSL_CERT_PATH=path/to/cert.pem
```

### Performance Optimization

For larger deployments or better performance:

1. **Database optimization**

Configure database connection pooling in `server/config/database.js`:

```javascript
connectionPool: {
  min: 5,
  max: 20,
  idle: 10000
}
```

2. **Asset optimization**

Run the asset optimization script for production builds:

```bash
npm run optimize:assets
```

3. **Caching strategy**

Configure the service worker caching strategy in `client/service-worker.js` based on your needs.

## Updating

To update Luna's Adventure to the latest version:

```bash
git pull
npm ci
npm run build
```

This will fetch the latest code, install dependencies using the exact versions from package-lock.json, and rebuild the application.

## Uninstallation

If you need to completely remove Luna's Adventure from your system:

```bash
# Stop running instances
npm run stop

# Remove the application files
cd ..
rm -rf lunas-adventure

# Remove global dependencies (optional)
npm uninstall -g nodemon sass
```

For Docker installations:

```bash
# Remove containers and volumes
docker compose down -v

# Remove images
docker rmi lunas-adventure-server lunas-adventure-client

# Remove the application files
cd ..
rm -rf lunas-adventure
```

---

Thank you for installing Luna's Adventure! If you have suggestions for improving this installation guide, please let us know through our GitHub repository or Discord community.