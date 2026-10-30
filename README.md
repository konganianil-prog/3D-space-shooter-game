# GALAXY WARRIORS – 3D SPACE SHOOTER GAME

A AAA-inspired, complete, fully playable 3D Sci-Fi Space Shooter built with **HTML5, CSS3, JavaScript, WebGL, Three.js, GSAP, and the Web Audio API**.

---

## 🚀 FEATURES

### 1. Cinematic 3D Deep Space Environment
- **Multi-layered Starfield**: Over 6,000 animated stars with depth stratification and warp speed streak elongation during afterburner boost.
- **Dynamic Procedural Nebulae**: Additive glowing cosmic gas clouds with rotational drifting and level-specific color themes.
- **Rotating Planets**: Procedurally textured Gas Giants with planetary ring systems and glowing volcanic planets.
- **Interactive Asteroid Field**: Procedurally deformed 3D tumbling rocks that can be destroyed with laser fire or collided with.
- **Meteor Showers**: High-speed glowing fireballs streaking across the celestial background.
- **Atmospheric Lighting**: Dynamic directional sun lighting with rim lighting that adapts to each level's theme.

### 2. Player Spaceships & Flight Dynamics
- **3 Selectable Spaceships in the Hangar**:
  - **Aegis Starfighter**: Balanced combat fighter with dual cannons and high agility.
  - **Valkyrie Interceptor**: High-speed striker with swept-forward wings and quad lasers.
  - **Titan Dreadnought**: Heavy armored battle cruiser with reinforced hull, triple thrusters, and heavy plasma turrets.
- **Realistic Flight Physics**:
  - 3D banking physics (Pitch up/down, Roll into turns, Yaw steering).
  - Smooth inertia damping and boundary constraints.
  - Animated engine thruster cones that scale and emit trailing particle plumes.
  - Holographic energy shield bubble that ripples and flashes on impact.
  - Critical damage smoke and fire trails when hull drops below 35%.

### 3. Comprehensive Weapon Arsenal
1. **Twin Blue Laser**: High-velocity dual energy bolts.
2. **Dual Blaster**: Triple spread barrage for clearing swarms.
3. **Plasma Cannon**: Heavy explosive plasma spheres with splash damage.
4. **Hyper Gatling**: Ultra high rate-of-fire rapid laser cannon.
5. **Ion Railgun**: Piercing high-energy beam penetrating through multiple enemies.
6. **Homing Missiles (E key)**: 3D modeled rocket projectiles with smoke trails that actively track and steer toward active enemies and bosses.

### 4. Enemy AI & Alien Formations
- **Scout Fighters**: Agile dive-bombers executing sweeping flight paths.
- **Alien Interceptors**: Bio-mechanical stealth craft with evasive zigzag dodging when the player fires at them.
- **Armored Cruisers**: Heavy vessels with dual plasma turrets.
- **Kamikaze Swarmers**: Needle-shaped suicide ships with pulsating red cores that lock onto the player and accelerate to ram!
- **Elite Marauders**: Heavy battlecruisers equipped with energy shields and high-damage plasma bursts.
- **Formations**: V-Formation, Line Sweep, Pincer Flank, and Swarm rushes.

### 5. Multi-Phase Alien Boss Battles
- **Goliath Titan Dreadnought** & **Dark Galaxy Destroyer**:
  - Massive multi-segmented 3D alien flagships with rotating orbital containment rings, pulsating dark matter reactors, and heavy outrigger cannons.
  - **Attack Patterns**:
    - Quad Laser Salvos
    - Radial Plasma Spread
    - Devastating Mega Ion Beam Cannon (sweeping across the arena)
    - Plasma Bombs
  - **Phases**:
    - Phase 1 (100%–60% HP): Standard artillery salvos.
    - Phase 2 (60%–30% HP): Defensive energy shield deployment (reduces damage by 60%).
    - Phase 3 (<30% HP): Enraged core overdrive with high speed and rapid-fire barrage.
  - **Cinematic Boss Destruction**: Multi-stage chained hull explosions, screen shake, slow-mo finale, and shockwave supernova!

### 6. Visual Effects & Particles
- Zero-lag particle pools for explosions, fireballs, sparks, and tumbling 3D debris.
- Additive shockwave rings that expand dynamically.
- 3D floating combat text (Damage numbers, "+500 SCORE", "SHIELD DOWN!").
- Dynamic camera trauma and screen shake system.
- Warp speed streak lines during boost.

### 7. Zero-Dependency Procedural Audio Engine
- Built entirely on the **Web Audio API** (100% offline, zero missing audio files, zero CORS issues):
  - Pitch-swept laser blasters and heavy plasma booms.
  - Rocket launch whooshes and multi-layered explosion rumbles.
  - Resonant shield deflection pings and ascending arpeggio chords for power-ups.
  - Warning sirens and boss alarms.
  - Dynamic continuous engine hum that modulates pitch and volume based on speed and boost.
  - **Algorithmic Dynamic Sci-Fi Music Synthesizer**: Procedural 4-track electronic synth music with bassline, cyber arpeggios, and rhythmic percussion that adapts to menu, combat, and boss battles!

### 8. Full Sci-Fi HUD & Radar
- Animated Hull integrity, Shield generator, and Afterburner energy bars.
- Live Score counter and dynamic Combo Multiplier (up to 10x).
- Circular Sci-Fi Radar Minimap showing player (Cyan), enemies (Red), and bosses (Magenta).
- Full touch controls for mobile/tablet screens.
- LocalStorage persistence for High Scores, Unlocked Levels, and Audio Settings.

---

## 🎮 FLIGHT CONTROLS

| Action | Keyboard / Mouse | Touch Screen |
| :--- | :--- | :--- |
| **Move Up / Forward** | `W` or `Arrow Up` | Drag / Virtual controls |
| **Move Down / Backward** | `S` or `Arrow Down` | Drag / Virtual controls |
| **Bank Left** | `A` or `Arrow Left` | Drag / Virtual controls |
| **Bank Right** | `D` or `Arrow Right` | Drag / Virtual controls |
| **Fire Primary Weapon** | `SPACE` | `FIRE` Button |
| **Afterburner Boost** | `SHIFT` | `BOOST` Button |
| **Homing Missiles** | `E` | `MISSILE` Button |
| **Tactical Pause** | `ESC` or Pause Button | HUD Pause Button |

---

## 📂 PROJECT STRUCTURE

```
space_shooter/
│
├── index.html          # Main HTML structure, HUD, menus & modal overlays
├── style.css           # Sci-Fi theme, Glassmorphism, gauges & HUD layout
├── main.js             # Engine loop, game states, collisions & wave director
├── player.js           # 3D player ships, banking physics, shields & controls
├── enemies.js          # Enemy types, procedural ships, AI behaviors & formations
├── weapons.js          # Weapon configurations, homing missiles & 3D power-ups
├── environment.js      # Starfields, nebulae, rotating planets & asteroids
├── effects.js          # Particle explosions, shockwaves, debris & screen shake
├── boss.js             # Giant alien boss ships, attack patterns & mega beam
├── ui.js               # HUD data bindings, radar minimap & modal controllers
├── audio.js            # Web Audio API procedural sound engine & synth music
│
├── assets/             # Project assets directory
├── models/             # 3D model resources
├── textures/           # Texture storage
└── sounds/             # Audio storage
```

---

## 💻 HOW TO RUN IN VS CODE & WEB BROWSERS

### Option A: Double-Click (Direct Browser Open)
1. Navigate to the project directory in Windows Explorer:
   `c:\Users\konga\OneDrive\Desktop\space_shooter`
2. Double-click `index.html`.
3. It will open directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave.
4. **All features, procedural textures, 3D graphics, and audio work immediately!**

### Option B: VS Code Live Server
1. Open the `space_shooter` folder in VS Code (`File > Open Folder...`).
2. If you have the **Live Server** extension installed:
   - Right-click `index.html` and select **"Open with Live Server"**.
   - Or click **"Go Live"** in the bottom status bar.
3. The game will launch at `http://127.0.0.1:5500/index.html`.

---

## ⚡ PERFORMANCE OPTIMIZATIONS
- **Object Pooling**: Projectiles, missiles, and particles are pooled to avoid garbage collection hitches.
- **Procedural Canvas Textures**: Generated once in memory at startup, eliminating external network requests and CORS security restrictions.
- **Lightweight Low-Poly Geometries**: High visual fidelity achieved through smooth shading, vertex color gradients, and dynamic emissive highlights rather than heavy polygon counts.
- **Adaptive Pixel Ratio**: Clamped to maximum 2x for silky smooth 60 FPS performance on high-DPI displays.
