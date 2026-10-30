/**
 * GALAXY WARRIORS - 3D Space & Aerial Shooter Game
 * main.js: 2-Player Co-Op & Versus Sky Dogfight, Level Progression & Collisions
 */

class Game {
    constructor() {
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAME_OVER', 'VICTORY'
        this.gameMode = '2P_COOP'; // '1P', '2P_COOP', '2P_VS'

        // Three.js Core
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Game Managers
        this.effects = null;
        this.environment = null;
        this.weapons = null;
        this.player1 = null;
        this.player2 = null;
        this.enemies = null;
        this.boss = null;
        this.ui = null;

        // Versus Mode Scores
        this.vsScore = { p1: 0, p2: 0 };
        this.vsTargetKills = 5;

        // Level & Wave Director
        this.currentLevel = 1;
        this.maxLevels = 5;
        this.waveNumber = 0;
        this.waveSpawnTimer = 0;
        this.waveInterval = 8.0;
        this.enemiesKilledThisLevel = 0;
        this.bossSpawned = false;

        // Stats & Tracking
        this.totalEnemiesDestroyed = 0;
        this.gameStartTime = 0;
        this.survivalTime = 0;
        this.highScore = 0;
        this.unlockedLevel = 1;

        this.init();
    }

    init() {
        this.loadProgress();

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a1224, 0.0018);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
        this.camera.position.set(0, 6, 22);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        // Instantiate Managers
        this.effects = new EffectsManager(this.scene, this.camera);
        this.environment = new EnvironmentManager(this.scene, this.camera);
        this.weapons = new WeaponManager(this.scene, this.effects, window.audio);

        // Two Active Players (P1: Alpha-1, P2: Bravo-2)
        this.player1 = new Player(this.scene, this.camera, this.weapons, this.effects, window.audio, 'p1');
        this.player2 = new Player(this.scene, this.camera, this.weapons, this.effects, window.audio, 'p2');

        this.enemies = new EnemyManager(this.scene, this.weapons, this.effects, window.audio);
        this.boss = new BossManager(this.scene, this.weapons, this.effects, window.audio);
        this.ui = new UIManager();
        this.ui.bindGame(this);

        window.addEventListener('resize', () => this.onWindowResize());

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
            }
        });

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    loadProgress() {
        try {
            const savedScore = localStorage.getItem('gw_high_score');
            if (savedScore) this.highScore = parseInt(savedScore, 10) || 0;

            const savedLevel = localStorage.getItem('gw_unlocked_level');
            if (savedLevel) this.unlockedLevel = parseInt(savedLevel, 10) || 1;
        } catch (e) {
            console.warn("LocalStorage access failed:", e);
        }
    }

    saveProgress() {
        try {
            const best = Math.max(this.player1.score, this.player2.score);
            if (best > this.highScore) {
                this.highScore = best;
                localStorage.setItem('gw_high_score', this.highScore.toString());
            }
            if (this.currentLevel > this.unlockedLevel) {
                this.unlockedLevel = Math.min(this.maxLevels, this.currentLevel);
                localStorage.setItem('gw_unlocked_level', this.unlockedLevel.toString());
            }
        } catch (e) {
            console.warn("LocalStorage save failed:", e);
        }
    }

    // ==========================================
    // GAME FLOW & STATE CONTROL
    // ==========================================

    startGame(mode = '2P_COOP') {
        this.gameMode = mode;
        window.audio.init();
        window.audio.startEngineHum();
        window.audio.startMusic('combat');

        this.state = 'PLAYING';
        this.enemies.clearAll();
        this.weapons.clearAll();
        this.boss.clear();

        if (this.gameMode === '1P') {
            this.player1.reset(0);
            this.player1.mesh.visible = true;
            this.player2.mesh.visible = false;
        } else if (this.gameMode === '2P_COOP') {
            this.player1.reset(-14);
            this.player2.reset(14);
            this.player1.mesh.visible = true;
            this.player2.mesh.visible = true;
        } else if (this.gameMode === '2P_VS') {
            this.vsScore = { p1: 0, p2: 0 };
            this.player1.reset(-18);
            this.player2.reset(18);
            this.player1.mesh.visible = true;
            this.player2.mesh.visible = true;
        }

        this.currentLevel = 1;
        this.waveNumber = 0;
        this.enemiesKilledThisLevel = 0;
        this.bossSpawned = false;
        this.gameStartTime = performance.now();
        this.totalEnemiesDestroyed = 0;

        this.environment.setTheme(this.currentLevel);
        this.enemies.currentLevel = this.currentLevel;

        this.ui.showScreen('game');
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            window.audio.stopEngineHum();
            this.ui.showScreen('pause');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            window.audio.startEngineHum();
            this.ui.showScreen('game');
        }
    }

    restart() {
        this.startGame(this.gameMode);
    }

    returnToMenu() {
        this.state = 'MENU';
        window.audio.stopEngineHum();
        window.audio.setMusicMode('ambient');

        this.enemies.clearAll();
        this.weapons.clearAll();
        this.boss.clear();
        this.player1.reset(0);
        this.player2.reset(0);

        this.ui.showScreen('mainMenu');
    }

    nextLevel() {
        if (this.currentLevel < this.maxLevels) {
            this.currentLevel++;
            this.enemies.currentLevel = this.currentLevel;
            this.environment.setTheme(this.currentLevel);

            this.enemiesKilledThisLevel = 0;
            this.bossSpawned = false;
            this.waveNumber = 0;

            this.state = 'PLAYING';
            this.ui.showScreen('game');
            window.audio.setMusicMode('combat');
            this.effects.createFloatingText(this.player1.mesh.position, `AIR SQUADRON WARPING TO LEVEL ${this.currentLevel}!`, '#00ffff');
        } else {
            this.returnToMenu();
        }
    }

    triggerGameOver(winner = null) {
        this.state = 'GAME_OVER';
        window.audio.stopEngineHum();
        window.audio.stopMusic();
        window.audio.playGameOver();

        this.survivalTime = (performance.now() - this.gameStartTime) / 1000;
        const bestScore = Math.max(this.player1.score, this.player2.score);
        const isNewRecord = bestScore > this.highScore;
        this.saveProgress();

        this.ui.showGameOver(bestScore, this.totalEnemiesDestroyed, this.survivalTime, isNewRecord, winner);
    }

    triggerVictory() {
        this.state = 'VICTORY';
        window.audio.stopEngineHum();
        window.audio.setMusicMode('ambient');

        this.saveProgress();
        const total = this.player1.score + this.player2.score;
        this.ui.showVictory(total, this.currentLevel, 3);
    }

    // ==========================================
    // WAVE DIRECTOR
    // ==========================================

    updateWaveDirector(delta) {
        if (this.gameMode === '2P_VS') return; // In 1v1 Sky Dogfight, players fight each other!
        if (this.bossSpawned) return;

        this.waveSpawnTimer += delta;
        const requiredKills = 14 + this.currentLevel * 4;

        if (this.enemiesKilledThisLevel >= requiredKills && !this.bossSpawned) {
            this.bossSpawned = true;
            this.boss.spawnBoss(this.currentLevel, () => {
                this.effects.createFloatingText(new THREE.Vector3(0, 5, -80), 'WARNING: AIR DREADNOUGHT INCOMING!', '#ff0033');
            });
            return;
        }

        if (this.waveSpawnTimer >= this.waveInterval) {
            this.waveSpawnTimer = 0;
            this.waveNumber++;

            if (this.currentLevel === 1) {
                const pattern = Math.random() > 0.5 ? 'v_formation' : 'line';
                this.enemies.spawnFormation(pattern, 'fighter');
            } else if (this.currentLevel === 2) {
                const pattern = Math.random() > 0.4 ? 'v_formation' : 'pincer';
                this.enemies.spawnFormation(pattern, 'alien');
            } else if (this.currentLevel === 3) {
                this.enemies.spawnFormation('pincer', 'alien');
                this.enemies.spawnEnemy('heavy', new THREE.Vector3((Math.random() - 0.5) * 30, 0, -250), { behavior: 'cruiser' });
            } else if (this.currentLevel === 4) {
                if (Math.random() < 0.6) {
                    this.enemies.spawnFormation('kamikaze_swarm', 'kamikaze');
                } else {
                    this.enemies.spawnEnemy('elite', new THREE.Vector3(0, 0, -240), { behavior: 'cruiser' });
                    this.enemies.spawnFormation('line', 'fighter');
                }
            } else if (this.currentLevel === 5) {
                this.enemies.spawnFormation('kamikaze_swarm', 'kamikaze');
                this.enemies.spawnEnemy('elite', new THREE.Vector3(0, 0, -240), { behavior: 'cruiser' });
            }
        }
    }

    // ==========================================
    // COLLISION DETECTION & DOGFIGHT COMBAT
    // ==========================================

    checkCollisions() {
        const activePlayers = [this.player1];
        if (this.gameMode !== '1P') activePlayers.push(this.player2);

        const projectiles = this.weapons.projectiles;
        const missiles = this.weapons.missiles;
        const airBlasts = this.weapons.airBlasts;
        const enemyProjectiles = this.weapons.enemyProjectiles;
        const enemies = this.enemies.enemies;
        const powerups = this.weapons.powerups;
        const asteroids = this.environment.asteroids;
        const boss = this.boss;

        // --- 1. 2-PLAYER VERSUS SKY DOGFIGHT (P1 VS P2) ---
        if (this.gameMode === '2P_VS') {
            const p1 = this.player1;
            const p2 = this.player2;

            // P1 and P2 Projectiles hitting each other
            for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
                const p = projectiles[pIdx];
                const target = p.owner === 'p1' ? p2 : p1;

                if (p.mesh.position.distanceTo(target.mesh.position) < p.radius + 2.0) {
                    target.takeDamage(p.damage);
                    this.effects.createExplosion(p.mesh.position, 0.8, p.owner === 'p1' ? 'blue' : 'fire');
                    this.scene.remove(p.mesh);
                    projectiles.splice(pIdx, 1);

                    if (target.health <= 0 && target.lives <= 0) {
                        const winner = p.owner === 'p1' ? 'PLAYER 1 (ALPHA-1)' : 'PLAYER 2 (BRAVO-2)';
                        this.triggerGameOver(winner);
                        return;
                    }
                }
            }

            // Air Blasts hitting opposing player (knockback & damage)
            for (const ab of airBlasts) {
                const target = ab.owner === 'p1' ? p2 : p1;
                const dist = ab.mesh.position.distanceTo(target.mesh.position);
                if (dist < ab.radius + 2.5) {
                    target.takeDamage(45);
                    const pushDir = (target.mesh.position.x > ab.mesh.position.x) ? 18 : -18;
                    target.mesh.position.x += pushDir * 0.15;
                    this.effects.createFloatingText(target.mesh.position, 'AIR BLAST IMPACT!', '#ffaa00');
                }
            }

            // Homing missiles hitting opposing player
            for (let mIdx = missiles.length - 1; mIdx >= 0; mIdx--) {
                const m = missiles[mIdx];
                const target = m.owner === 'p1' ? p2 : p1;

                if (m.mesh.position.distanceTo(target.mesh.position) < m.radius + 2.0) {
                    target.takeDamage(m.damage);
                    this.effects.createExplosion(m.mesh.position, 1.8, 'fire');
                    this.scene.remove(m.mesh);
                    missiles.splice(mIdx, 1);

                    if (target.health <= 0 && target.lives <= 0) {
                        const winner = m.owner === 'p1' ? 'PLAYER 1 (ALPHA-1)' : 'PLAYER 2 (BRAVO-2)';
                        this.triggerGameOver(winner);
                        return;
                    }
                }
            }
            return;
        }

        // --- 2. CO-OP & 1P MODE VS ENEMIES ---
        // Player Projectiles vs Enemies, Asteroids, Boss
        for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
            const p = projectiles[pIdx];
            let projectileHit = false;
            const firingPlayer = p.owner === 'p2' ? this.player2 : this.player1;

            // Hit Enemies
            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = enemies[eIdx];
                if (p.mesh.position.distanceTo(e.mesh.position) < p.radius + e.radius) {
                    projectileHit = true;
                    const killed = this.enemies.damageEnemy(eIdx, p.damage);
                    if (killed) {
                        firingPlayer.score += e.scoreValue * firingPlayer.multiplier;
                        this.enemiesKilledThisLevel++;
                        this.totalEnemiesDestroyed++;
                        firingPlayer.multiplierTimer = 4.0;
                        firingPlayer.multiplier = Math.min(10, firingPlayer.multiplier + 1);
                    }
                    if (!p.piercing) break;
                }
            }

            // Hit Asteroids
            if (!projectileHit) {
                for (let aIdx = asteroids.length - 1; aIdx >= 0; aIdx--) {
                    const ast = asteroids[aIdx];
                    if (p.mesh.position.distanceTo(ast.mesh.position) < p.radius + ast.radius) {
                        projectileHit = true;
                        ast.hp -= p.damage;
                        this.effects.createExplosion(p.mesh.position, 0.4, 'spark');

                        if (ast.hp <= 0) {
                            this.effects.createExplosion(ast.mesh.position, ast.radius * 0.9, 'fire');
                            this.audio.playExplosion('small');
                            firingPlayer.score += 50 * firingPlayer.multiplier;
                            ast.mesh.position.z = -280;
                            ast.hp = ast.maxHp;
                        }
                        if (!p.piercing) break;
                    }
                }
            }

            // Hit Boss
            if (!projectileHit && boss.active && boss.boss) {
                if (p.mesh.position.distanceTo(boss.boss.mesh.position) < p.radius + boss.boss.radius) {
                    projectileHit = true;
                    const destroyed = boss.takeDamage(p.damage);
                    if (destroyed) {
                        firingPlayer.score += 15000 * firingPlayer.multiplier;
                        setTimeout(() => this.triggerVictory(), 3800);
                    }
                }
            }

            if (projectileHit && !p.piercing) {
                this.scene.remove(p.mesh);
                projectiles.splice(pIdx, 1);
            }
        }

        // Air Blasts vs Enemies (Area concussive wave)
        for (const ab of airBlasts) {
            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = enemies[eIdx];
                if (ab.mesh.position.distanceTo(e.mesh.position) < ab.radius + e.radius) {
                    const killed = this.enemies.damageEnemy(eIdx, ab.damage);
                    if (killed) {
                        const firingPlayer = ab.owner === 'p2' ? this.player2 : this.player1;
                        firingPlayer.score += e.scoreValue * firingPlayer.multiplier;
                        this.enemiesKilledThisLevel++;
                        this.totalEnemiesDestroyed++;
                    }
                }
            }
        }

        // Homing Missiles vs Enemies & Boss
        for (let mIdx = missiles.length - 1; mIdx >= 0; mIdx--) {
            const m = missiles[mIdx];
            let missileHit = false;
            const firingPlayer = m.owner === 'p2' ? this.player2 : this.player1;

            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = enemies[eIdx];
                if (m.mesh.position.distanceTo(e.mesh.position) < m.radius + e.radius) {
                    missileHit = true;
                    this.effects.createExplosion(m.mesh.position, 1.8, 'fire');
                    const killed = this.enemies.damageEnemy(eIdx, m.damage);
                    if (killed) {
                        firingPlayer.score += e.scoreValue * firingPlayer.multiplier;
                        this.enemiesKilledThisLevel++;
                        this.totalEnemiesDestroyed++;
                    }
                    break;
                }
            }

            if (!missileHit && boss.active && boss.boss) {
                if (m.mesh.position.distanceTo(boss.boss.mesh.position) < m.radius + boss.boss.radius) {
                    missileHit = true;
                    this.effects.createExplosion(m.mesh.position, 2.2, 'fire');
                    const destroyed = boss.takeDamage(m.damage);
                    if (destroyed) {
                        firingPlayer.score += 15000 * firingPlayer.multiplier;
                        setTimeout(() => this.triggerVictory(), 3800);
                    }
                }
            }

            if (missileHit) {
                this.scene.remove(m.mesh);
                missiles.splice(mIdx, 1);
            }
        }

        // Enemy Projectiles vs Active Players
        for (let epIdx = enemyProjectiles.length - 1; epIdx >= 0; epIdx--) {
            const ep = enemyProjectiles[epIdx];
            for (const ply of activePlayers) {
                if (ply.health > 0 && ep.mesh.position.distanceTo(ply.mesh.position) < ep.radius + 1.8) {
                    ply.takeDamage(ep.damage);
                    this.scene.remove(ep.mesh);
                    enemyProjectiles.splice(epIdx, 1);
                    break;
                }
            }
        }

        // Asteroids vs Active Players
        for (const ast of asteroids) {
            for (const ply of activePlayers) {
                if (ply.health > 0 && ast.mesh.position.distanceTo(ply.mesh.position) < ast.radius + 1.8) {
                    ply.takeDamage(45);
                    this.effects.createExplosion(ast.mesh.position, ast.radius * 0.8, 'fire');
                    ast.mesh.position.z = -280;
                }
            }
        }

        // Power-ups collected by whichever player reaches them
        for (let puIdx = powerups.length - 1; puIdx >= 0; puIdx--) {
            const pu = powerups[puIdx];
            for (const ply of activePlayers) {
                if (ply.health > 0 && pu.group.position.distanceTo(ply.mesh.position) < pu.radius + 2.2) {
                    ply.applyPowerup(pu.type);
                    ply.score += 250;
                    this.scene.remove(pu.group);
                    powerups.splice(puIdx, 1);
                    break;
                }
            }
        }

        // Check if both players are destroyed in Co-Op or 1P
        const allDead = activePlayers.every(p => p.health <= 0 && p.lives <= 0);
        if (allDead) {
            this.triggerGameOver();
        }
    }

    // ==========================================
    // RENDER & ANIMATION LOOP
    // ==========================================

    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(0.1, this.clock.getDelta());

        if (this.state === 'MENU' || this.state === 'SHIP_SELECT') {
            const time = performance.now() * 0.0006;
            this.camera.position.x = Math.sin(time) * 14;
            this.camera.position.y = 4 + Math.sin(time * 0.5) * 3;
            this.camera.position.z = 18 + Math.cos(time) * 6;
            this.camera.lookAt(0, 0, 0);

            if (this.player1 && this.player1.mesh) {
                this.player1.mesh.position.set(-6, 0, 0);
                this.player1.mesh.rotation.y = time * 1.2;
            }
            if (this.player2 && this.player2.mesh) {
                this.player2.mesh.position.set(6, 0, 0);
                this.player2.mesh.rotation.y = -time * 1.2;
            }

            this.environment.update(delta, 0.4, false);
            this.effects.update(delta);

        } else if (this.state === 'PLAYING') {
            // Update Active Players
            this.player1.update(delta);
            if (this.gameMode !== '1P') {
                this.player2.update(delta);
            }

            const activeTargetList = [...this.enemies.enemies];
            if (this.gameMode === '2P_VS') {
                activeTargetList.push({ mesh: this.player1.mesh, hp: this.player1.health });
                activeTargetList.push({ mesh: this.player2.mesh, hp: this.player2.health });
            }

            this.weapons.update(delta, activeTargetList, this.boss);
            this.enemies.update(delta, this.player1, this.weapons.projectiles);
            this.boss.update(delta, this.player1);
            this.environment.update(delta, 1.0, this.player1.isBoosting || this.player2.isBoosting);
            this.effects.update(delta);

            this.updateWaveDirector(delta);
            this.checkCollisions();

            // Multiplier Decays
            for (const p of [this.player1, this.player2]) {
                if (p.multiplier > 1) {
                    p.multiplierTimer -= delta;
                    if (p.multiplierTimer <= 0) p.multiplier = 1;
                }
            }

            // Dynamic Co-Op / Dogfight Camera Tracking
            let midX = this.player1.mesh.position.x;
            let midY = this.player1.mesh.position.y;
            let zoomDist = 22;

            if (this.gameMode !== '1P') {
                midX = (this.player1.mesh.position.x + this.player2.mesh.position.x) * 0.5;
                midY = (this.player1.mesh.position.y + this.player2.mesh.position.y) * 0.5;
                const distBetween = this.player1.mesh.position.distanceTo(this.player2.mesh.position);
                zoomDist = Math.max(22, 16 + distBetween * 0.45);
            }

            const targetCamX = midX * 0.35;
            const targetCamY = 5 + midY * 0.35;
            const targetCamZ = zoomDist + (this.player1.isBoosting ? 4 : 0);

            this.camera.position.x += (targetCamX - this.camera.position.x) * 6 * delta;
            this.camera.position.y += (targetCamY - this.camera.position.y) * 6 * delta;
            this.camera.position.z += (targetCamZ - this.camera.position.z) * 6 * delta;

            this.camera.lookAt(midX * 0.5, midY * 0.5, -30);

            // Update UI HUD
            this.ui.updateDualHUD(this.player1, this.player2, this.gameMode, this.currentLevel, this.boss);

        } else if (this.state === 'PAUSED') {
            this.effects.update(delta * 0.1);
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
