// client/scripts/renderer.js

/**
 * SVG Renderer Service
 * Handles rendering game entities using SVG graphics
 */
class SVGRenderer {
    /**
     * Initialize the SVG renderer
     * @param {string} containerId - ID of the container element
     * @param {number} width - Game viewport width
     * @param {number} height - Game viewport height
     */
    constructor(containerId, width, height) {
      this.container = document.getElementById(containerId);
      this.svgNS = "http://www.w3.org/2000/svg";
      this.width = width;
      this.height = height;
      this.entities = new Map();
      this.debug = false;
      
      this.initialize();
    }
    
    /**
     * Initialize the SVG container
     */
    initialize() {
      // Create the SVG element
      this.svg = document.createElementNS(this.svgNS, "svg");
      this.svg.setAttribute("width", this.width);
      this.svg.setAttribute("height", this.height);
      this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
      this.svg.id = "game-svg";
      
      // Create layers for different game elements
      this.createLayer("background");
      this.createLayer("platforms");
      this.createLayer("collectibles");
      this.createLayer("enemies");
      this.createLayer("players");
      this.createLayer("ui");
      
      // Add the SVG to the container
      this.container.appendChild(this.svg);
      
      console.log("SVG Renderer initialized");
    }
    
    /**
     * Create a layer for organizing SVG elements
     * @param {string} name - Layer name
     */
    createLayer(name) {
      const layer = document.createElementNS(this.svgNS, "g");
      layer.setAttribute("id", `layer-${name}`);
      this.svg.appendChild(layer);
    }
    
    /**
     * Clear all entities from a specific layer
     * @param {string} layerName - Name of the layer to clear
     */
    clearLayer(layerName) {
      const layer = document.getElementById(`layer-${layerName}`);
      if (layer) {
        while (layer.firstChild) {
          layer.removeChild(layer.firstChild);
        }
      }
    }
    
    /**
     * Create or update the player character (Luna)
     * @param {Object} player - Player data object
     * @param {boolean} isLocalPlayer - Whether this is the local player
     */
    renderPlayer(player, isLocalPlayer = false) {
      let playerElement = document.getElementById(`entity-${player.id}`);
      const layer = document.getElementById("layer-players");
      
      if (!playerElement) {
        // Create new player SVG group
        playerElement = document.createElementNS(this.svgNS, "g");
        playerElement.setAttribute("id", `entity-${player.id}`);
        layer.appendChild(playerElement);
        
        // Create Luna's body parts
        this.createLunaSVG(playerElement);
        
        if (isLocalPlayer) {
          // Highlight local player
          const highlight = document.createElementNS(this.svgNS, "circle");
          highlight.setAttribute("cx", "30");
          highlight.setAttribute("cy", "20");
          highlight.setAttribute("r", "35");
          highlight.setAttribute("fill", "rgba(255, 255, 255, 0.2)");
          highlight.setAttribute("stroke", "#FFD700");
          highlight.setAttribute("stroke-width", "2");
          highlight.setAttribute("stroke-dasharray", "5,5");
          highlight.setAttribute("class", "player-highlight");
          playerElement.appendChild(highlight);
        }
        
        // Add to entities map
        this.entities.set(player.id, playerElement);
      }
      
      // Update player position and state
      playerElement.setAttribute("transform", `translate(${player.x}, ${player.y})`);
      
      // Flip the SVG based on direction
      if (player.direction === "left") {
        playerElement.setAttribute("transform", `translate(${player.x + player.width}, ${player.y}) scale(-1, 1)`);
      } else {
        playerElement.setAttribute("transform", `translate(${player.x}, ${player.y})`);
      }
      
      // Add jumping animation
      if (player.isJumping) {
        playerElement.classList.add("jumping");
      } else {
        playerElement.classList.remove("jumping");
      }
      
      // Show damage animation
      if (player.health < 100) {
        playerElement.classList.add("damaged");
        setTimeout(() => {
          playerElement.classList.remove("damaged");
        }, 200);
      }
      
      // Add debug bounding box if debug mode is on
      if (this.debug) {
        this.renderDebugBox(playerElement, player.width, player.height, "player");
      }
    }
    
    /**
     * Create SVG elements for Luna the guinea pig
     * @param {SVGElement} group - Group element to add Luna parts to
     */
    createLunaSVG(group) {
      // Main body
      const body = document.createElementNS(this.svgNS, "ellipse");
      body.setAttribute("cx", "30");
      body.setAttribute("cy", "20");
      body.setAttribute("rx", "30");
      body.setAttribute("ry", "20");
      body.setAttribute("fill", "#D2B48C");
      body.setAttribute("stroke", "#8B4513");
      body.setAttribute("stroke-width", "1.5");
      body.setAttribute("class", "luna-body");
      group.appendChild(body);
      
      // Face
      const face = document.createElementNS(this.svgNS, "ellipse");
      face.setAttribute("cx", "55");
      face.setAttribute("cy", "18");
      face.setAttribute("rx", "12");
      face.setAttribute("ry", "10");
      face.setAttribute("fill", "#E5C39E");
      face.setAttribute("stroke", "#8B4513");
      face.setAttribute("stroke-width", "1.5");
      group.appendChild(face);
      
      // Ears
      const leftEar = document.createElementNS(this.svgNS, "ellipse");
      leftEar.setAttribute("cx", "60");
      leftEar.setAttribute("cy", "8");
      leftEar.setAttribute("rx", "5");
      leftEar.setAttribute("ry", "7");
      leftEar.setAttribute("fill", "#D2B48C");
      leftEar.setAttribute("stroke", "#8B4513");
      leftEar.setAttribute("stroke-width", "1");
      group.appendChild(leftEar);
      
      const rightEar = document.createElementNS(this.svgNS, "ellipse");
      rightEar.setAttribute("cx", "50");
      rightEar.setAttribute("cy", "8");
      rightEar.setAttribute("rx", "5");
      rightEar.setAttribute("ry", "7");
      rightEar.setAttribute("fill", "#D2B48C");
      rightEar.setAttribute("stroke", "#8B4513");
      rightEar.setAttribute("stroke-width", "1");
      group.appendChild(rightEar);
      
      // Eyes
      const leftEye = document.createElementNS(this.svgNS, "circle");
      leftEye.setAttribute("cx", "58");
      leftEye.setAttribute("cy", "15");
      leftEye.setAttribute("r", "2");
      leftEye.setAttribute("fill", "#000000");
      leftEye.setAttribute("class", "luna-eye");
      group.appendChild(leftEye);
      
      const rightEye = document.createElementNS(this.svgNS, "circle");
      rightEye.setAttribute("cx", "52");
      rightEye.setAttribute("cy", "15");
      rightEye.setAttribute("r", "2");
      rightEye.setAttribute("fill", "#000000");
      rightEye.setAttribute("class", "luna-eye");
      group.appendChild(rightEye);
      
      // Nose
      const nose = document.createElementNS(this.svgNS, "ellipse");
      nose.setAttribute("cx", "55");
      nose.setAttribute("cy", "20");
      nose.setAttribute("rx", "3");
      nose.setAttribute("ry", "2");
      nose.setAttribute("fill", "#FFC0CB");
      nose.setAttribute("class", "luna-nose");
      group.appendChild(nose);
      
      // Mouth
      const mouth = document.createElementNS(this.svgNS, "path");
      mouth.setAttribute("d", "M55 22 Q 55 24, 58 24");
      mouth.setAttribute("fill", "none");
      mouth.setAttribute("stroke", "#8B4513");
      mouth.setAttribute("stroke-width", "0.75");
      group.appendChild(mouth);
      
      // Feet
      const leftFoot = document.createElementNS(this.svgNS, "ellipse");
      leftFoot.setAttribute("cx", "10");
      leftFoot.setAttribute("cy", "35");
      leftFoot.setAttribute("rx", "5");
      leftFoot.setAttribute("ry", "3");
      leftFoot.setAttribute("fill", "#C19A6B");
      leftFoot.setAttribute("class", "luna-foot");
      group.appendChild(leftFoot);
      
      const middleFoot = document.createElementNS(this.svgNS, "ellipse");
      middleFoot.setAttribute("cx", "25");
      middleFoot.setAttribute("cy", "35");
      middleFoot.setAttribute("rx", "5");
      middleFoot.setAttribute("ry", "3");
      middleFoot.setAttribute("fill", "#C19A6B");
      middleFoot.setAttribute("class", "luna-foot");
      group.appendChild(middleFoot);
      
      const rightFoot = document.createElementNS(this.svgNS, "ellipse");
      rightFoot.setAttribute("cx", "40");
      rightFoot.setAttribute("cy", "35");
      rightFoot.setAttribute("rx", "5");
      rightFoot.setAttribute("ry", "3");
      rightFoot.setAttribute("fill", "#C19A6B");
      rightFoot.setAttribute("class", "luna-foot");
      group.appendChild(rightFoot);
      
      // Cute pattern on back
      const pattern1 = document.createElementNS(this.svgNS, "ellipse");
      pattern1.setAttribute("cx", "25");
      pattern1.setAttribute("cy", "10");
      pattern1.setAttribute("rx", "5");
      pattern1.setAttribute("ry", "7");
      pattern1.setAttribute("fill", "#E5C39E");
      pattern1.setAttribute("transform", "rotate(-15, 25, 10)");
      group.appendChild(pattern1);
      
      const pattern2 = document.createElementNS(this.svgNS, "ellipse");
      pattern2.setAttribute("cx", "15");
      pattern2.setAttribute("cy", "15");
      pattern2.setAttribute("rx", "4");
      pattern2.setAttribute("ry", "6");
      pattern2.setAttribute("fill", "#E5C39E");
      pattern2.setAttribute("transform", "rotate(-25, 15, 15)");
      group.appendChild(pattern2);
      
      const pattern3 = document.createElementNS(this.svgNS, "ellipse");
      pattern3.setAttribute("cx", "5");
      pattern3.setAttribute("cy", "20");
      pattern3.setAttribute("rx", "3");
      pattern3.setAttribute("ry", "5");
      pattern3.setAttribute("fill", "#E5C39E");
      pattern3.setAttribute("transform", "rotate(-35, 5, 20)");
      group.appendChild(pattern3);
    }
    
    /**
     * Render a platform or ground element
     * @param {Object} platform - Platform data object
     */
    renderPlatform(platform) {
      let platformElement = document.getElementById(`entity-${platform.id}`);
      const layer = document.getElementById("layer-platforms");
      
      if (!platformElement) {
        // Create new platform SVG rectangle
        platformElement = document.createElementNS(this.svgNS, "rect");
        platformElement.setAttribute("id", `entity-${platform.id}`);
        
        // Style based on platform type
        if (platform.type === "ground") {
          platformElement.setAttribute("fill", "#8B4513");
          platformElement.setAttribute("stroke", "#654321");
        } else {
          platformElement.setAttribute("fill", "#A0522D");
          platformElement.setAttribute("stroke", "#654321");
          platformElement.setAttribute("rx", "5"); // Rounded corners for platforms
          platformElement.setAttribute("ry", "5");
        }
        
        platformElement.setAttribute("stroke-width", "2");
        layer.appendChild(platformElement);
        
        // Add to entities map
        this.entities.set(platform.id, platformElement);
      }
      
      // Update platform position and dimensions
      platformElement.setAttribute("x", platform.x);
      platformElement.setAttribute("y", platform.y);
      platformElement.setAttribute("width", platform.width);
      platformElement.setAttribute("height", platform.height);
      
      // Add debug bounding box if debug mode is on
      if (this.debug) {
        this.renderDebugBox(platformElement, platform.width, platform.height, "platform");
      }
    }
    
    /**
     * Render a collectible item (carrot)
     * @param {Object} collectible - Collectible data object
     */
    renderCollectible(collectible) {
      if (collectible.collected) {
        // If already collected, ensure it's removed from rendering
        const existingElement = document.getElementById(`entity-${collectible.id}`);
        if (existingElement) {
          existingElement.remove();
          this.entities.delete(collectible.id);
        }
        return;
      }
      
      let collectibleElement = document.getElementById(`entity-${collectible.id}`);
      const layer = document.getElementById("layer-collectibles");
      
      if (!collectibleElement) {
        // Create new collectible SVG group
        collectibleElement = document.createElementNS(this.svgNS, "g");
        collectibleElement.setAttribute("id", `entity-${collectible.id}`);
        layer.appendChild(collectibleElement);
        
        if (collectible.type === "carrot") {
          // Create carrot SVG
          this.createCarrotSVG(collectibleElement);
        }
        
        // Add to entities map
        this.entities.set(collectible.id, collectibleElement);
      }
      
      // Update collectible position
      collectibleElement.setAttribute("transform", `translate(${collectible.x}, ${collectible.y})`);
      
      // Add a subtle animation effect
      const animateY = document.createElementNS(this.svgNS, "animateTransform");
      animateY.setAttribute("attributeName", "transform");
      animateY.setAttribute("type", "translate");
      animateY.setAttribute("from", `${collectible.x} ${collectible.y}`);
      animateY.setAttribute("to", `${collectible.x} ${collectible.y - 5}`);
      animateY.setAttribute("dur", "1s");
      animateY.setAttribute("repeatCount", "indefinite");
      animateY.setAttribute("additive", "sum");
      animateY.setAttribute("calcMode", "spline");
      animateY.setAttribute("keySplines", "0.4 0 0.6 1; 0.4 0 0.6 1");
      collectibleElement.appendChild(animateY);
      
      // Add debug bounding box if debug mode is on
      if (this.debug) {
        this.renderDebugBox(collectibleElement, collectible.width, collectible.height, "collectible");
      }
    }
    
    /**
     * Create SVG elements for a carrot collectible
     * @param {SVGElement} group - Group element to add carrot parts to
     */
    createCarrotSVG(group) {
      // Carrot body
      const carrotBody = document.createElementNS(this.svgNS, "path");
      carrotBody.setAttribute("d", "M15,25 Q15,5 5,0 L0,5 Q20,15 10,30 Z");
      carrotBody.setAttribute("fill", "#FF7F00");
      carrotBody.setAttribute("stroke", "#DD6600");
      carrotBody.setAttribute("stroke-width", "1");
      group.appendChild(carrotBody);
      
      // Carrot top (leaves)
      const carrotTop = document.createElementNS(this.svgNS, "path");
      carrotTop.setAttribute("d", "M5,0 C0,-5 -5,-3 -8,-8 M5,0 C5,-5 5,-3 2,-10 M5,0 C10,-5 12,-3 12,-7");
      carrotTop.setAttribute("fill", "none");
      carrotTop.setAttribute("stroke", "#00AA00");
      carrotTop.setAttribute("stroke-width", "1.5");
      carrotTop.setAttribute("stroke-linecap", "round");
      group.appendChild(carrotTop);
    }
    
    /**
     * Render an enemy
     * @param {Object} enemy - Enemy data object
     */
    renderEnemy(enemy) {
      let enemyElement = document.getElementById(`entity-${enemy.id}`);
      const layer = document.getElementById("layer-enemies");
      
      if (!enemyElement) {
        // Create new enemy SVG group
        enemyElement = document.createElementNS(this.svgNS, "g");
        enemyElement.setAttribute("id", `entity-${enemy.id}`);
        layer.appendChild(enemyElement);
        
        // Create different enemy types
        if (enemy.type === "basic") {
          this.createBasicEnemySVG(enemyElement);
        } else if (enemy.type === "flying") {
          this.createFlyingEnemySVG(enemyElement);
        }
        
        // Add to entities map
        this.entities.set(enemy.id, enemyElement);
      }
      
      // Update enemy position and direction
      if (enemy.direction === "left") {
        enemyElement.setAttribute("transform", `translate(${enemy.x + enemy.width}, ${enemy.y}) scale(-1, 1)`);
      } else {
        enemyElement.setAttribute("transform", `translate(${enemy.x}, ${enemy.y})`);
      }
      
      // Add animation based on enemy type
      if (enemy.type === "flying") {
        // Add wing flapping animation
        const wings = enemyElement.querySelector(".enemy-wings");
        if (wings) {
          wings.setAttribute("transform", `rotate(${Math.sin(Date.now() / 200) * 15})`);
        }
      }
      
      // Add debug bounding box if debug mode is on
      if (this.debug) {
        this.renderDebugBox(enemyElement, enemy.width, enemy.height, "enemy");
      }
    }
    
    /**
     * Create SVG elements for a basic ground enemy
     * @param {SVGElement} group - Group element to add enemy parts to
     */
    createBasicEnemySVG(group) {
      // Enemy body
      const body = document.createElementNS(this.svgNS, "ellipse");
      body.setAttribute("cx", "20");
      body.setAttribute("cy", "20");
      body.setAttribute("rx", "20");
      body.setAttribute("ry", "15");
      body.setAttribute("fill", "#8B008B");
      body.setAttribute("stroke", "#4B0082");
      body.setAttribute("stroke-width", "2");
      body.setAttribute("class", "enemy-body");
      group.appendChild(body);
      
      // Enemy eyes
      const leftEye = document.createElementNS(this.svgNS, "circle");
      leftEye.setAttribute("cx", "12");
      leftEye.setAttribute("cy", "15");
      leftEye.setAttribute("r", "4");
      leftEye.setAttribute("fill", "#FFFFFF");
      leftEye.setAttribute("class", "enemy-eye");
      group.appendChild(leftEye);
      
      const rightEye = document.createElementNS(this.svgNS, "circle");
      rightEye.setAttribute("cx", "28");
      rightEye.setAttribute("cy", "15");
      rightEye.setAttribute("r", "4");
      rightEye.setAttribute("fill", "#FFFFFF");
      rightEye.setAttribute("class", "enemy-eye");
      group.appendChild(rightEye);
      
      // Enemy pupils
      const leftPupil = document.createElementNS(this.svgNS, "circle");
      leftPupil.setAttribute("cx", "14");
      leftPupil.setAttribute("cy", "15");
      leftPupil.setAttribute("r", "2");
      leftPupil.setAttribute("fill", "#FF0000");
      group.appendChild(leftPupil);
      
      const rightPupil = document.createElementNS(this.svgNS, "circle");
      rightPupil.setAttribute("cx", "30");
      rightPupil.setAttribute("cy", "15");
      rightPupil.setAttribute("r", "2");
      rightPupil.setAttribute("fill", "#FF0000");
      group.appendChild(rightPupil);
      
      // Enemy mouth
      const mouth = document.createElementNS(this.svgNS, "path");
      mouth.setAttribute("d", "M10,25 Q20,35 30,25");
      mouth.setAttribute("fill", "none");
      mouth.setAttribute("stroke", "#FFFFFF");
      mouth.setAttribute("stroke-width", "2");
      group.appendChild(mouth);
      
      // Enemy feet
      const leftFoot = document.createElementNS(this.svgNS, "ellipse");
      leftFoot.setAttribute("cx", "10");
      leftFoot.setAttribute("cy", "35");
      leftFoot.setAttribute("rx", "6");
      leftFoot.setAttribute("ry", "3");
      leftFoot.setAttribute("fill", "#4B0082");
      group.appendChild(leftFoot);
      
      const rightFoot = document.createElementNS(this.svgNS, "ellipse");
      rightFoot.setAttribute("cx", "30");
      rightFoot.setAttribute("cy", "35");
      rightFoot.setAttribute("rx", "6");
      rightFoot.setAttribute("ry", "3");
      rightFoot.setAttribute("fill", "#4B0082");
      group.appendChild(rightFoot);
    }
    
    /**
     * Create SVG elements for a flying enemy
     * @param {SVGElement} group - Group element to add enemy parts to
     */
    createFlyingEnemySVG(group) {
      // Enemy body
      const body = document.createElementNS(this.svgNS, "ellipse");
      body.setAttribute("cx", "20");
      body.setAttribute("cy", "20");
      body.setAttribute("rx", "15");
      body.setAttribute("ry", "10");
      body.setAttribute("fill", "#FF6347");
      body.setAttribute("stroke", "#B22222");
      body.setAttribute("stroke-width", "2");
      body.setAttribute("class", "enemy-body");
      group.appendChild(body);
      
      // Enemy wings
      const wings = document.createElementNS(this.svgNS, "g");
      wings.setAttribute("class", "enemy-wings");
      
      const leftWing = document.createElementNS(this.svgNS, "path");
      leftWing.setAttribute("d", "M5,20 Q-10,5 5,0 Q10,5 5,20");
      leftWing.setAttribute("fill", "#FFA07A");
      leftWing.setAttribute("stroke", "#B22222");
      leftWing.setAttribute("stroke-width", "1");
      wings.appendChild(leftWing);
      
      const rightWing = document.createElementNS(this.svgNS, "path");
      rightWing.setAttribute("d", "M35,20 Q50,5 35,0 Q30,5 35,20");
      rightWing.setAttribute("fill", "#FFA07A");
      rightWing.setAttribute("stroke", "#B22222");
      rightWing.setAttribute("stroke-width", "1");
      wings.appendChild(rightWing);
      
      group.appendChild(wings);
      
      // Enemy eyes
      const leftEye = document.createElementNS(this.svgNS, "circle");
      leftEye.setAttribute("cx", "15");
      leftEye.setAttribute("cy", "15");
      leftEye.setAttribute("r", "3");
      leftEye.setAttribute("fill", "#FFFFFF");
      leftEye.setAttribute("class", "enemy-eye");
      group.appendChild(leftEye);
      
      const rightEye = document.createElementNS(this.svgNS, "circle");
      rightEye.setAttribute("cx", "25");
      rightEye.setAttribute("cy", "15");
      rightEye.setAttribute("r", "3");
      rightEye.setAttribute("fill", "#FFFFFF");
      rightEye.setAttribute("class", "enemy-eye");
      group.appendChild(rightEye);
      
      // Enemy pupils
      const leftPupil = document.createElementNS(this.svgNS, "circle");
      leftPupil.setAttribute("cx", "16");
      leftPupil.setAttribute("cy", "15");
      leftPupil.setAttribute("r", "1.5");
      leftPupil.setAttribute("fill", "#000000");
      group.appendChild(leftPupil);
      
      const rightPupil = document.createElementNS(this.svgNS, "circle");
      rightPupil.setAttribute("cx", "26");
      rightPupil.setAttribute("cy", "15");
      rightPupil.setAttribute("r", "1.5");
      rightPupil.setAttribute("fill", "#000000");
      group.appendChild(rightPupil);
      
      // Enemy beak
      const beak = document.createElementNS(this.svgNS, "path");
      beak.setAttribute("d", "M15,22 L20,28 L25,22");
      beak.setAttribute("fill", "#FFD700");
      beak.setAttribute("stroke", "#B8860B");
      beak.setAttribute("stroke-width", "1");
      beak.setAttribute("stroke-linejoin", "round");
      group.appendChild(beak);
    }
    
    /**
     * Render debug bounding box for collision detection visualization
     * @param {SVGElement} element - Element to add debug box to
     * @param {number} width - Width of the bounding box
     * @param {number} height - Height of the bounding box
     * @param {string} type - Entity type for color coding
     */
    renderDebugBox(element, width, height, type) {
      let debugBox = element.querySelector(".debug-box");
      
      if (!debugBox) {
        debugBox = document.createElementNS(this.svgNS, "rect");
        debugBox.setAttribute("class", "debug-box");
        debugBox.setAttribute("width", width);
        debugBox.setAttribute("height", height);
        debugBox.setAttribute("fill", "none");
        
        switch (type) {
          case "player":
            debugBox.setAttribute("stroke", "#00FF00");
            break;
          case "enemy":
            debugBox.setAttribute("stroke", "#FF0000");
            break;
          case "platform":
            debugBox.setAttribute("stroke", "#0000FF");
            break;
          case "collectible":
            debugBox.setAttribute("stroke", "#FFFF00");
            break;
          default:
            debugBox.setAttribute("stroke", "#FFFFFF");
        }
        
        debugBox.setAttribute("stroke-width", "1");
        debugBox.setAttribute("stroke-dasharray", "5,5");
        element.appendChild(debugBox);
      } else {
        debugBox.setAttribute("width", width);
        debugBox.setAttribute("height", height);
      }
    }
    
    /**
     * Render game UI elements (score, lives, health)
     * @param {Object} gameState - Current game state
     * @param {string} playerId - Local player ID
     */
    renderUI(gameState, playerId) {
      const layer = document.getElementById("layer-ui");
      this.clearLayer("ui");
      
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return;
      
      // Create UI container
      const uiGroup = document.createElementNS(this.svgNS, "g");
      uiGroup.setAttribute("id", "game-ui");
      layer.appendChild(uiGroup);
      
      // Score text
      const scoreText = document.createElementNS(this.svgNS, "text");
      scoreText.setAttribute("x", "20");
      scoreText.setAttribute("y", "30");
      scoreText.setAttribute("fill", "#FFFFFF");
      scoreText.setAttribute("font-family", "Arial, sans-serif");
      scoreText.setAttribute("font-size", "24px");
      scoreText.setAttribute("font-weight", "bold");
      scoreText.setAttribute("stroke", "#000000");
      scoreText.setAttribute("stroke-width", "0.5");
      scoreText.textContent = `Score: ${player.score}`;
      uiGroup.appendChild(scoreText);
      
      // Lives
      for (let i = 0; i < player.lives; i++) {
        const heart = document.createElementNS(this.svgNS, "path");
        heart.setAttribute("d", `M${20 + i * 30},70 a7,7 0 0,1 14,0 a7,7 0 0,1 14,0 q0,12 -14,20 q-14,-8 -14,-20`);
        heart.setAttribute("fill", "#FF0000");
        heart.setAttribute("stroke", "#800000");
        heart.setAttribute("stroke-width", "1");
        uiGroup.appendChild(heart);
      }
      
      // Health bar background
      const healthBarBg = document.createElementNS(this.svgNS, "rect");
      healthBarBg.setAttribute("x", "20");
      healthBarBg.setAttribute("y", "80");
      healthBarBg.setAttribute("width", "200");
      healthBarBg.setAttribute("height", "15");
      healthBarBg.setAttribute("fill", "#555555");
      healthBarBg.setAttribute("rx", "7");
      healthBarBg.setAttribute("ry", "7");
      uiGroup.appendChild(healthBarBg);
      
      // Health bar
      const healthBar = document.createElementNS(this.svgNS, "rect");
      healthBar.setAttribute("x", "20");
      healthBar.setAttribute("y", "80");
      healthBar.setAttribute("width", `${player.health * 2}`);
      healthBar.setAttribute("height", "15");
      healthBar.setAttribute("fill", `rgb(${255 - player.health * 2.55}, ${player.health * 2.55}, 0)`);
      healthBar.setAttribute("rx", "7");
      healthBar.setAttribute("ry", "7");
      uiGroup.appendChild(healthBar);
      
      // Health text
      const healthText = document.createElementNS(this.svgNS, "text");
      healthText.setAttribute("x", "120");
      healthText.setAttribute("y", "93");
      healthText.setAttribute("fill", "#FFFFFF");
      healthText.setAttribute("font-family", "Arial, sans-serif");
      healthText.setAttribute("font-size", "12px");
      healthText.setAttribute("font-weight", "bold");
      healthText.setAttribute("text-anchor", "middle");
      healthText.textContent = `${player.health}%`;
      uiGroup.appendChild(healthText);
    }
    
    /**
     * Render game over screen
     * @param {number} score - Final score
     */
    renderGameOver(score) {
      this.clearAllLayers();
      const layer = document.getElementById("layer-ui");
      
      // Game over container with semi-transparent background
      const container = document.createElementNS(this.svgNS, "g");
      container.setAttribute("id", "game-over-screen");
      
      // Background overlay
      const overlay = document.createElementNS(this.svgNS, "rect");
      overlay.setAttribute("x", "0");
      overlay.setAttribute("y", "0");
      overlay.setAttribute("width", this.width);
      overlay.setAttribute("height", this.height);
      overlay.setAttribute("fill", "rgba(0, 0, 0, 0.7)");
      container.appendChild(overlay);
      
      // Game over text
      const gameOverText = document.createElementNS(this.svgNS, "text");
      gameOverText.setAttribute("x", this.width / 2);
      gameOverText.setAttribute("y", this.height / 2 - 50);
      gameOverText.setAttribute("fill", "#FF0000");
      gameOverText.setAttribute("font-family", "Arial, sans-serif");
      gameOverText.setAttribute("font-size", "48px");
      gameOverText.setAttribute("font-weight", "bold");
      gameOverText.setAttribute("text-anchor", "middle");
      gameOverText.textContent = "GAME OVER";
      container.appendChild(gameOverText);
      
      // Score text
      const scoreText = document.createElementNS(this.svgNS, "text");
      scoreText.setAttribute("x", this.width / 2);
      scoreText.setAttribute("y", this.height / 2);
      scoreText.setAttribute("fill", "#FFFFFF");
      scoreText.setAttribute("font-family", "Arial, sans-serif");
      scoreText.setAttribute("font-size", "32px");
      scoreText.setAttribute("text-anchor", "middle");
      scoreText.textContent = `Final Score: ${score}`;
      container.appendChild(scoreText);
      
      // Restart button
      const buttonGroup = document.createElementNS(this.svgNS, "g");
      buttonGroup.setAttribute("id", "restart-button");
      buttonGroup.setAttribute("transform", `translate(${this.width / 2 - 100}, ${this.height / 2 + 50})`);
      buttonGroup.style.cursor = "pointer";
      
      const buttonBg = document.createElementNS(this.svgNS, "rect");
      buttonBg.setAttribute("width", "200");
      buttonBg.setAttribute("height", "50");
      buttonBg.setAttribute("fill", "#4CAF50");
      buttonBg.setAttribute("rx", "10");
      buttonBg.setAttribute("ry", "10");
      buttonGroup.appendChild(buttonBg);
      
      const buttonText = document.createElementNS(this.svgNS, "text");
      buttonText.setAttribute("x", "100");
      buttonText.setAttribute("y", "32");
      buttonText.setAttribute("fill", "#FFFFFF");
      buttonText.setAttribute("font-family", "Arial, sans-serif");
      buttonText.setAttribute("font-size", "24px");
      buttonText.setAttribute("font-weight", "bold");
      buttonText.setAttribute("text-anchor", "middle");
      buttonText.textContent = "Play Again";
      buttonGroup.appendChild(buttonText);
      
      // Add click event
      buttonGroup.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("game:restart"));
      });
      
      container.appendChild(buttonGroup);
      layer.appendChild(container);
    }
    
    /**
     * Clear all layers and remove all entities
     */
    clearAllLayers() {
      this.clearLayer("background");
      this.clearLayer("platforms");
      this.clearLayer("collectibles");
      this.clearLayer("enemies");
      this.clearLayer("players");
      this.clearLayer("ui");
      this.entities.clear();
    }
    
    /**
     * Render the background with parallax effect
     * @param {number} cameraX - Camera X position for parallax
     */
    renderBackground(cameraX) {
      const layer = document.getElementById("layer-background");
      
      // Check if background already exists
      if (!document.getElementById("game-background")) {
        this.clearLayer("background");
        
        // Create background group
        const bgGroup = document.createElementNS(this.svgNS, "g");
        bgGroup.setAttribute("id", "game-background");
        layer.appendChild(bgGroup);
        
        // Sky gradient
        const skyGradient = document.createElementNS(this.svgNS, "linearGradient");
        skyGradient.setAttribute("id", "sky-gradient");
        skyGradient.setAttribute("x1", "0%");
        skyGradient.setAttribute("y1", "0%");
        skyGradient.setAttribute("x2", "0%");
        skyGradient.setAttribute("y2", "100%");
        
        const stop1 = document.createElementNS(this.svgNS, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "#87CEEB");
        skyGradient.appendChild(stop1);
        
        const stop2 = document.createElementNS(this.svgNS, "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "#E0F7FF");
        skyGradient.appendChild(stop2);
        
        const defs = document.createElementNS(this.svgNS, "defs");
        defs.appendChild(skyGradient);
        bgGroup.appendChild(defs);
        
        // Sky rectangle
        const sky = document.createElementNS(this.svgNS, "rect");
        sky.setAttribute("width", this.width);
        sky.setAttribute("height", this.height);
        sky.setAttribute("fill", "url(#sky-gradient)");
        bgGroup.appendChild(sky);
        
        // Sun
        const sun = document.createElementNS(this.svgNS, "circle");
        sun.setAttribute("cx", "100");
        sun.setAttribute("cy", "100");
        sun.setAttribute("r", "40");
        sun.setAttribute("fill", "#FFD700");
        bgGroup.appendChild(sun);
        
        // Sun glow
        const sunGlow = document.createElementNS(this.svgNS, "circle");
        sunGlow.setAttribute("cx", "100");
        sunGlow.setAttribute("cy", "100");
        sunGlow.setAttribute("r", "60");
        sunGlow.setAttribute("fill", "rgba(255, 215, 0, 0.3)");
        bgGroup.appendChild(sunGlow);
        
        // Background mountains (far)
        const farMountains = document.createElementNS(this.svgNS, "path");
        farMountains.setAttribute("d", "M0,250 L100,150 L200,220 L300,120 L400,180 L500,140 L600,200 L700,130 L800,190 L900,150 L1000,230 L1000,250 Z");
        farMountains.setAttribute("fill", "#8A9A5B");
        farMountains.setAttribute("opacity", "0.7");
        bgGroup.appendChild(farMountains);
        
        // Background mountains (middle)
        const midMountains = document.createElementNS(this.svgNS, "path");
        midMountains.setAttribute("d", "M-100,250 L0,180 L100,230 L200,150 L300,210 L400,160 L500,220 L600,170 L700,240 L800,160 L900,220 L1000,170 L1100,250 Z");
        midMountains.setAttribute("fill", "#6B8E23");
        midMountains.setAttribute("opacity", "0.8");
        bgGroup.appendChild(midMountains);
        
        // Background clouds
        this.createCloudSVG(bgGroup, 150, 80, 1.2);
        this.createCloudSVG(bgGroup, 450, 60, 0.9);
        this.createCloudSVG(bgGroup, 750, 90, 1.5);
        this.createCloudSVG(bgGroup, 950, 40, 0.7);
      }
      
      // Apply parallax effect based on camera position
      const bgGroup = document.getElementById("game-background");
      const farMountains = bgGroup.getElementsByTagName("path")[0];
      const midMountains = bgGroup.getElementsByTagName("path")[1];
      
      // Move background elements at different speeds for parallax effect
      farMountains.setAttribute("transform", `translate(${-cameraX * 0.1}, 0)`);
      midMountains.setAttribute("transform", `translate(${-cameraX * 0.3}, 0)`);
      
      // Move clouds
      const clouds = bgGroup.querySelectorAll(".cloud");
      clouds.forEach((cloud, index) => {
        // Combine camera parallax with continuous cloud movement
        const cloudSpeed = 0.02 * (index % 3 + 1);
        const parallaxOffset = -cameraX * 0.05 * (index % 2 + 1);
        const timeOffset = (Date.now() * cloudSpeed) % this.width;
        
        cloud.setAttribute("transform", `translate(${parallaxOffset + timeOffset}, 0)`);
      });
    }
    
    /**
     * Create cloud SVG for background
     * @param {SVGElement} parent - Parent element to add cloud to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} scale - Size scale factor
     */
    createCloudSVG(parent, x, y, scale = 1) {
      const cloudGroup = document.createElementNS(this.svgNS, "g");
      cloudGroup.setAttribute("class", "cloud");
      cloudGroup.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
      
      // Cloud parts
      const part1 = document.createElementNS(this.svgNS, "ellipse");
      part1.setAttribute("cx", "25");
      part1.setAttribute("cy", "20");
      part1.setAttribute("rx", "25");
      part1.setAttribute("ry", "15");
      part1.setAttribute("fill", "#FFFFFF");
      cloudGroup.appendChild(part1);
      
      const part2 = document.createElementNS(this.svgNS, "ellipse");
      part2.setAttribute("cx", "50");
      part2.setAttribute("cy", "15");
      part2.setAttribute("rx", "30");
      part2.setAttribute("ry", "20");
      part2.setAttribute("fill", "#FFFFFF");
      cloudGroup.appendChild(part2);
      
      const part3 = document.createElementNS(this.svgNS, "ellipse");
      part3.setAttribute("cx", "80");
      part3.setAttribute("cy", "20");
      part3.setAttribute("rx", "25");
      part3.setAttribute("ry", "15");
      part3.setAttribute("fill", "#FFFFFF");
      cloudGroup.appendChild(part3);
      
      parent.appendChild(cloudGroup);
    }
    
    /**
     * Render in-game notification or message
     * @param {string} message - Text message to display
     * @param {string} type - Message type (info, success, warning, error)
     * @param {number} duration - Display duration in milliseconds
     */
    renderNotification(message, type = "info", duration = 3000) {
      const layer = document.getElementById("layer-ui");
      
      // Create notification group
      const notificationGroup = document.createElementNS(this.svgNS, "g");
      notificationGroup.setAttribute("id", "game-notification");
      notificationGroup.setAttribute("opacity", "0");
      
      // Determine color based on type
      let fillColor, strokeColor;
      switch (type) {
        case "success":
          fillColor = "#4CAF50";
          strokeColor = "#388E3C";
          break;
        case "warning":
          fillColor = "#FF9800";
          strokeColor = "#F57C00";
          break;
        case "error":
          fillColor = "#F44336";
          strokeColor = "#D32F2F";
          break;
        default: // info
          fillColor = "#2196F3";
          strokeColor = "#1976D2";
      }
      
      // Notification background
      const bg = document.createElementNS(this.svgNS, "rect");
      bg.setAttribute("x", this.width / 2 - 150);
      bg.setAttribute("y", "20");
      bg.setAttribute("width", "300");
      bg.setAttribute("height", "40");
      bg.setAttribute("fill", fillColor);
      bg.setAttribute("stroke", strokeColor);
      bg.setAttribute("stroke-width", "2");
      bg.setAttribute("rx", "10");
      bg.setAttribute("ry", "10");
      notificationGroup.appendChild(bg);
      
      // Notification text
      const text = document.createElementNS(this.svgNS, "text");
      text.setAttribute("x", this.width / 2);
      text.setAttribute("y", "45");
      text.setAttribute("fill", "#FFFFFF");
      text.setAttribute("font-family", "Arial, sans-serif");
      text.setAttribute("font-size", "18px");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("text-anchor", "middle");
      text.textContent = message;
      notificationGroup.appendChild(text);
      
      // Add to UI layer
      layer.appendChild(notificationGroup);
      
      // Animation - fade in
      const fadeIn = document.createElementNS(this.svgNS, "animate");
      fadeIn.setAttribute("attributeName", "opacity");
      fadeIn.setAttribute("from", "0");
      fadeIn.setAttribute("to", "1");
      fadeIn.setAttribute("dur", "0.3s");
      fadeIn.setAttribute("fill", "freeze");
      notificationGroup.appendChild(fadeIn);
      
      // Remove after duration
      setTimeout(() => {
        // Animation - fade out
        const fadeOut = document.createElementNS(this.svgNS, "animate");
        fadeOut.setAttribute("attributeName", "opacity");
        fadeOut.setAttribute("from", "1");
        fadeOut.setAttribute("to", "0");
        fadeOut.setAttribute("dur", "0.3s");
        fadeOut.setAttribute("fill", "freeze");
        notificationGroup.appendChild(fadeOut);
        
        // Remove notification after fade out
        setTimeout(() => {
          notificationGroup.remove();
        }, 300);
      }, duration);
    }
    
    /**
     * Render a level completion screen
     * @param {Object} levelStats - Statistics for the completed level
     * @param {Function} onContinue - Callback for continue button
     */
    renderLevelComplete(levelStats, onContinue) {
      // Create semi-transparent overlay
      const layer = document.getElementById("layer-ui");
      
      // Level complete container
      const container = document.createElementNS(this.svgNS, "g");
      container.setAttribute("id", "level-complete-screen");
      
      // Background overlay
      const overlay = document.createElementNS(this.svgNS, "rect");
      overlay.setAttribute("x", "0");
      overlay.setAttribute("y", "0");
      overlay.setAttribute("width", this.width);
      overlay.setAttribute("height", this.height);
      overlay.setAttribute("fill", "rgba(0, 0, 0, 0.7)");
      container.appendChild(overlay);
      
      // Level complete banner
      const banner = document.createElementNS(this.svgNS, "rect");
      banner.setAttribute("x", this.width / 2 - 250);
      banner.setAttribute("y", "100");
      banner.setAttribute("width", "500");
      banner.setAttribute("height", "300");
      banner.setAttribute("fill", "#4CAF50");
      banner.setAttribute("stroke", "#388E3C");
      banner.setAttribute("stroke-width", "4");
      banner.setAttribute("rx", "20");
      banner.setAttribute("ry", "20");
      container.appendChild(banner);
      
      // Level complete text
      const titleText = document.createElementNS(this.svgNS, "text");
      titleText.setAttribute("x", this.width / 2);
      titleText.setAttribute("y", "150");
      titleText.setAttribute("fill", "#FFFFFF");
      titleText.setAttribute("font-family", "Arial, sans-serif");
      titleText.setAttribute("font-size", "36px");
      titleText.setAttribute("font-weight", "bold");
      titleText.setAttribute("text-anchor", "middle");
      titleText.textContent = "Level Complete!";
      container.appendChild(titleText);
      
      // Stats text
      const statsGroup = document.createElementNS(this.svgNS, "g");
      statsGroup.setAttribute("transform", `translate(${this.width / 2 - 150}, 180)`);
      
      const createStatText = (label, value, yOffset) => {
        const statLabel = document.createElementNS(this.svgNS, "text");
        statLabel.setAttribute("x", "0");
        statLabel.setAttribute("y", yOffset);
        statLabel.setAttribute("fill", "#FFFFFF");
        statLabel.setAttribute("font-family", "Arial, sans-serif");
        statLabel.setAttribute("font-size", "20px");
        statLabel.setAttribute("text-anchor", "start");
        statLabel.textContent = label;
        statsGroup.appendChild(statLabel);
        
        const statValue = document.createElementNS(this.svgNS, "text");
        statValue.setAttribute("x", "300");
        statValue.setAttribute("y", yOffset);
        statValue.setAttribute("fill", "#FFFFFF");
        statValue.setAttribute("font-family", "Arial, sans-serif");
        statValue.setAttribute("font-size", "20px");
        statValue.setAttribute("font-weight", "bold");
        statValue.setAttribute("text-anchor", "end");
        statValue.textContent = value;
        statsGroup.appendChild(statValue);
      };
      
      createStatText("Score:", levelStats.score, 0);
      createStatText("Carrots Collected:", `${levelStats.carrotsCollected}/${levelStats.totalCarrots}`, 30);
      createStatText("Enemies Defeated:", levelStats.enemiesDefeated, 60);
      createStatText("Time:", `${Math.floor(levelStats.time / 60)}:${(levelStats.time % 60).toString().padStart(2, '0')}`, 90);
      
      container.appendChild(statsGroup);
      
      // Continue button
      const buttonGroup = document.createElementNS(this.svgNS, "g");
      buttonGroup.setAttribute("id", "continue-button");
      buttonGroup.setAttribute("transform", `translate(${this.width / 2 - 100}, 320)`);
      buttonGroup.style.cursor = "pointer";
      
      const buttonBg = document.createElementNS(this.svgNS, "rect");
      buttonBg.setAttribute("width", "200");
      buttonBg.setAttribute("height", "50");
      buttonBg.setAttribute("fill", "#FFC107");
      buttonBg.setAttribute("stroke", "#FFA000");
      buttonBg.setAttribute("stroke-width", "2");
      buttonBg.setAttribute("rx", "10");
      buttonBg.setAttribute("ry", "10");
      buttonGroup.appendChild(buttonBg);
      
      const buttonText = document.createElementNS(this.svgNS, "text");
      buttonText.setAttribute("x", "100");
      buttonText.setAttribute("y", "32");
      buttonText.setAttribute("fill", "#000000");
      buttonText.setAttribute("font-family", "Arial, sans-serif");
      buttonText.setAttribute("font-size", "24px");
      buttonText.setAttribute("font-weight", "bold");
      buttonText.setAttribute("text-anchor", "middle");
      buttonText.textContent = "Continue";
      buttonGroup.appendChild(buttonText);
      
      // Add click event
      buttonGroup.addEventListener("click", onContinue);
      
      container.appendChild(buttonGroup);
      
      // Animate stars around the banner
      for (let i = 0; i < 20; i++) {
        const star = document.createElementNS(this.svgNS, "polygon");
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const size = 5 + Math.random() * 10;
        
        // Create 5-point star
        let points = "";
        for (let j = 0; j < 10; j++) {
          const radius = j % 2 === 0 ? size : size / 2;
          const angle = j * Math.PI / 5;
          points += `${x + radius * Math.sin(angle)},${y - radius * Math.cos(angle)} `;
        }
        
        star.setAttribute("points", points);
        star.setAttribute("fill", "#FFD700");
        
        // Add twinkling animation
        const animateOpacity = document.createElementNS(this.svgNS, "animate");
        animateOpacity.setAttribute("attributeName", "opacity");
        animateOpacity.setAttribute("values", "1;0.3;1");
        animateOpacity.setAttribute("dur", `${1 + Math.random() * 2}s`);
        animateOpacity.setAttribute("repeatCount", "indefinite");
        star.appendChild(animateOpacity);
        
        container.appendChild(star);
      }
      
      // Add to UI layer
      layer.appendChild(container);
    }
    
    /**
     * Toggle debug mode
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
      this.debug = enabled;
      console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
      
      // Update all existing entities with debug boxes
      if (enabled) {
        this.entities.forEach((element, id) => {
          const entity = document.getElementById(`entity-${id}`);
          if (entity) {
            // Get entity type from class or id
            let type = "unknown";
            if (entity.classList.contains("player")) type = "player";
            else if (entity.classList.contains("enemy")) type = "enemy";
            else if (entity.classList.contains("platform")) type = "platform";
            else if (entity.classList.contains("collectible")) type = "collectible";
            
            // Get entity dimensions
            const width = entity.getAttribute("width") || 50;
            const height = entity.getAttribute("height") || 50;
            
            this.renderDebugBox(entity, width, height, type);
          }
        });
      } else {
        // Remove all debug boxes
        const debugBoxes = this.svg.querySelectorAll(".debug-box");
        debugBoxes.forEach(box => box.remove());
      }
    }
}

// Export the renderer
export default SVGRenderer;