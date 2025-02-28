# Luna's Adventure 🐹

A delightful 2D side-scrolling platformer featuring Luna the Guinea Pig, built with Node.js and SVG graphics.

![Luna the Guinea Pig](docs/images/luna-preview.png)

## Overview

Luna's Adventure is a charming platformer game where you guide Luna the Guinea Pig through various levels, collecting carrots, avoiding enemies, and finding your way home. The game features:

- Smooth SVG-based graphics and animations
- Responsive controls for running and jumping
- Multiple levels with increasing difficulty
- Collectible items and power-ups
- Various enemy types with different behaviors
- Local high score tracking

## Game Story

Luna is a curious little guinea pig who has wandered away from her cozy home. Help her navigate through gardens, forests, and other environments while collecting carrots and avoiding dangers along the way. Each level brings Luna one step closer to finding her way back home.

## Technical Features

- **Event-driven architecture** for responsive gameplay
- **SVG-based graphics** for crisp visuals at any resolution
- **Service-based backend** for game logic and state management
- **Real-time multiplayer support** via Socket.IO
- **Responsive design** that works across devices
- **Open source** and easily extensible codebase

## Project Structure

The project follows a structured organization:

- `server/`: Backend Node.js server code
  - `services/`: Core game services (game engine, asset manager, etc.)
  - `controllers/`: API endpoints
  - `routes/`: Express routes
- `client/`: Frontend game client
  - `scripts/`: Game client JavaScript
  - `styles/`: CSS styling
  - `assets/`: Game assets (SVG sprites, levels)
- `shared/`: Code shared between client and server
- `docs/`: Documentation and guides

## Technology Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: SVG for all game assets
- **Deployment**: Docker containers (Azure-ready)
- **Testing**: Jest for unit and integration tests

## Screenshots

![Gameplay Screenshot 1](docs/images/gameplay-1.png)
*Luna navigating through the garden level*

![Gameplay Screenshot 2](docs/images/gameplay-2.png)
*Luna collecting carrots and avoiding flying enemies*

## Development Roadmap

- [x] Core game engine and physics
- [x] Basic SVG rendering and animations
- [x] Player controls and collision detection
- [x] Enemy AI and behavior patterns
- [ ] Additional levels beyond the initial set
- [ ] Power-up system with special abilities
- [ ] Boss battles at the end of each world
- [ ] Online leaderboards
- [ ] Customizable character skins

## Contributing

We welcome contributions to Luna's Adventure! Whether you're fixing bugs, improving documentation, or proposing new features, please see our [Contributing Guidelines](CONTRIBUTING.md).

## License

Luna's Adventure is released under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Credits

- Game concept and development: [Your Name/Team]
- Character design: Luna is inspired by real guinea pigs and their adorable behaviors
- Special thanks to the open-source community for the wonderful tools and libraries that made this game possible

## Contact

For questions, feedback, or suggestions, please open an issue on our GitHub repository or contact us at [your-email@example.com].

---

Happy gaming, and help Luna find her way home! 🐹🥕