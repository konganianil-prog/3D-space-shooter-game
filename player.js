/**
 * GALAXY WARRIORS - 3D Space & Aerial Shooter
 * player.js: 2-Player Support, Atmospheric Aerial Flight Dynamics, Wing Contrails & Air Blasts
 */

class Player {
    constructor(scene, camera, weapons, effects, audio, playerId = 'p1') {
        this.scene = scene;
        this.camera = camera;
        this.weapons = weapons;
        this.effects = effects;
        this.audio = audio;
        this.playerId = playerId; // 'p1' or 'p2'
        this.callsign = playerId === 'p1' ? 'ALPHA-1' : 'BRAVO-2';

        // Ship Selection Type
        this.shipType = playerId === 'p1' ? 'aegis' : 'valkyrie';
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);

        // Core Player Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxShield = 100;
        this.shield = 100;
        this.shieldRechargeDelay = 3.0;
        this.shieldTimer = 0;
        this.shieldRegenRate = 18;

        this.maxBoost = 100;
        this.boost = 100;
        this.boostDrainRate = 35;
        this.boostRechargeRate = 22;
        this.isBoosting = false;

        this.specialMissiles = 5;
        this.maxSpecialMissiles = 10;
        this.airBlasts = 3;
        this.maxAirBlasts = 6;
        this.lives = 3;
        this.score = 0;
        this.multiplier = 1;
        this.multiplierTimer = 0;

        // Weapon System
        this.currentWeapon = 'laser';
        this.lastFireTime = 0;
        this.damageMultiplier = 1.0;

        // Physics & Motion
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.baseSpeed = 34;
        this.boostMultiplier = 1.85;

        // 3D Banking & Rotation
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.bankAngle = 0.58; // Roll angle during turn

        // Movement boundaries
        this.bounds = {
            minX: -45,
            maxX: 45,
            minY: -24,
            maxY: 24,
            minZ: -25,
            maxZ: 10
        };

        // Shield Mesh & Components
        this.shieldMesh = null;
        this.thrusterFlames = [];
        this.wingtips = [];
        this.isDamaged = false;
        this.damageFlashTimer = 0;

        // Controls input buffer
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            boost: false,
            missile: false,
            airBlast: false
        };

        // Virtual Touch & Mouse Controls (P1 only)
        this.mouseControl = false;
        this.mouseTarget = new THREE.Vector3(0, 0, 0);

        // Build 3D Ship Model
        this.buildShipModel();
        this.initControls();
    }

    // ==========================================
    // PROCEDURAL 3D SPACESHIP / JET FIGHTER
    // ==========================================

    buildShipModel() {
        while (this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
        }
        this.thrusterFlames = [];
        this.wingtips = [];

        // Player Color Palette
        const isP2 = this.playerId === 'p2';
        const primaryColor = isP2 ? 0xff2244 : 0x00d4ff;
        const emissiveColor = isP2 ? 0xcc3300 : 0x0066cc;
        const flameColor = isP2 ? 0xff7700 : 0x00ddff;

        const hullMat = new THREE.MeshStandardMaterial({
            color: isP2 ? 0x2b1c20 : 0x1e2638,
            metalness: 0.85,
            roughness: 0.25
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: primaryColor,
            metalness: 0.6,
            roughness: 0.3,
            emissive: emissiveColor,
            emissiveIntensity: 0.7
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: isP2 ? 0x441111 : 0x113355,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.85
        });

        // 1. Fuselage
        const bodyGeom = new THREE.ConeGeometry(1.2, 5.4, 8);
        bodyGeom.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeom, hullMat);
        body.scale.set(1.1, 0.65, 1);
        this.mesh.add(body);

        // Cockpit visor
        const canopyGeom = new THREE.SphereGeometry(0.75, 16, 16);
        const canopy = new THREE.Mesh(canopyGeom, glassMat);
        canopy.position.set(0, 0.45, -0.6);
        canopy.scale.set(0.65, 0.5, 1.8);
        this.mesh.add(canopy);

        // 2. Swept Air Delta Wings
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(4.4, -2.4);
        wingShape.lineTo(4.0, -3.4);
        wingShape.lineTo(0, -1.8);
        wingShape.closePath();

        const extrudeSettings = { depth: 0.16, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
        const wingGeom = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
        wingGeom.rotateX(Math.PI / 2);

        const leftWing = new THREE.Mesh(wingGeom, hullMat);
        leftWing.position.set(0.4, 0, 0.5);
        this.mesh.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeom, hullMat);
        rightWing.position.set(-0.4, 0, 0.5);
        rightWing.scale.set(-1, 1, 1);
        this.mesh.add(rightWing);

        // Wingtip contrail emitters & fins
        const finGeom = new THREE.BoxGeometry(0.12, 0.9, 1.6);
        const leftFin = new THREE.Mesh(finGeom, accentMat);
        leftFin.position.set(4.4, 0.35, -1.4);
        this.mesh.add(leftFin);
        this.wingtips.push(leftFin);

        const rightFin = new THREE.Mesh(finGeom, accentMat);
        rightFin.position.set(-4.4, 0.35, -1.4);
        this.mesh.add(rightFin);
        this.wingtips.push(rightFin);

        // 3. Dual Cannons
        const cannonGeom = new THREE.CylinderGeometry(0.12, 0.14, 2.2, 8);
        cannonGeom.rotateX(Math.PI / 2);
        const leftCannon = new THREE.Mesh(cannonGeom, accentMat);
        leftCannon.position.set(2.4, -0.15, -1.4);
        this.mesh.add(leftCannon);

        const rightCannon = new THREE.Mesh(cannonGeom, accentMat);
        rightCannon.position.set(-2.4, -0.15, -1.4);
        this.mesh.add(rightCannon);

        // 4. Twin Jet Thrusters & Glowing Flame Cones
        for (const side of [-0.9, 0.9]) {
            const engineGeom = new THREE.CylinderGeometry(0.42, 0.48, 1.6, 12);
            engineGeom.rotateX(Math.PI / 2);
            const engine = new THREE.Mesh(engineGeom, hullMat);
            engine.position.set(side, 0, 2.2);
            this.mesh.add(engine);

            const flameGeom = new THREE.ConeGeometry(0.38, 2.4, 12);
            flameGeom.rotateX(-Math.PI / 2);
            const flameMat = new THREE.MeshBasicMaterial({
                color: flameColor,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending
            });
            const flame = new THREE.Mesh(flameGeom, flameMat);
            flame.position.set(side, 0, 3.4);
            this.mesh.add(flame);
            this.thrusterFlames.push(flame);
        }

        // Energy Shield Dome
        const shieldGeom = new THREE.SphereGeometry(3.6, 24, 24);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: primaryColor,
            transparent: true,
            opacity: 0,
            wireframe: true,
            blending: THREE.AdditiveBlending
        });
        this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
        this.mesh.add(this.shieldMesh);
    }

    setShipType(type) {
        this.shipType = type;
        this.buildShipModel();
    }

    // ==========================================
    // SEPARATE CONTROLS FOR PLAYER 1 & PLAYER 2
    // ==========================================

    initControls() {
        window.addEventListener('keydown', (e) => {
            const code = e.code;

            if (this.playerId === 'p1') {
                // Player 1 Controls (WASD, Space, Shift, Q, E)
                if (code === 'KeyW') this.keys.up = true;
                if (code === 'KeyS') this.keys.down = true;
                if (code === 'KeyA') this.keys.left = true;
                if (code === 'KeyD') this.keys.right = true;
                if (code === 'Space') {
                    this.keys.fire = true;
                    e.preventDefault();
                }
                if (code === 'ShiftLeft') this.keys.boost = true;
                if (code === 'KeyE') this.fireSpecialMissile();
                if (code === 'KeyQ') this.fireAirBlast();
            } else if (this.playerId === 'p2') {
                // Player 2 Controls (Arrows, Numpad / L, M, K, P)
                if (code === 'ArrowUp') this.keys.up = true;
                if (code === 'ArrowDown') this.keys.down = true;
                if (code === 'ArrowLeft') this.keys.left = true;
                if (code === 'ArrowRight') this.keys.right = true;
                if (code === 'Numpad0' || code === 'Enter' || code === 'KeyL' || code === 'Slash') {
                    this.keys.fire = true;
                    e.preventDefault();
                }
                if (code === 'ShiftRight' || code === 'KeyM') this.keys.boost = true;
                if (code === 'Numpad1' || code === 'KeyP' || code === 'KeyI') this.fireSpecialMissile();
                if (code === 'NumpadDecimal' || code === 'KeyK' || code === 'KeyO') this.fireAirBlast();
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;

            if (this.playerId === 'p1') {
                if (code === 'KeyW') this.keys.up = false;
                if (code === 'KeyS') this.keys.down = false;
                if (code === 'KeyA') this.keys.left = false;
                if (code === 'KeyD') this.keys.right = false;
                if (code === 'Space') this.keys.fire = false;
                if (code === 'ShiftLeft') this.keys.boost = false;
            } else if (this.playerId === 'p2') {
                if (code === 'ArrowUp') this.keys.up = false;
                if (code === 'ArrowDown') this.keys.down = false;
                if (code === 'ArrowLeft') this.keys.left = false;
                if (code === 'ArrowRight') this.keys.right = false;
                if (code === 'Numpad0' || code === 'Enter' || code === 'KeyL' || code === 'Slash') this.keys.fire = false;
                if (code === 'ShiftRight' || code === 'KeyM') this.keys.boost = false;
            }
        });
    }

    // ==========================================
    // COMBAT & AIR WEAPONS
    // ==========================================

    shoot() {
        const now = performance.now() / 1000;
        const config = this.weapons.weaponTypes[this.currentWeapon] || this.weapons.weaponTypes.laser;

        if (now - this.lastFireTime >= config.fireRate) {
            this.weapons.firePlayerWeapon(
                this.currentWeapon,
                this.mesh.position,
                1.0,
                this.damageMultiplier,
                this.playerId
            );
            this.lastFireTime = now;
        }
    }

    fireAirBlast() {
        if (this.airBlasts <= 0) return;
        this.airBlasts--;
        this.weapons.spawnAirBlast(this.mesh.position, this.playerId);
        this.effects.createFloatingText(
            this.mesh.position,
            `${this.callsign} AIR BLAST!`,
            this.playerId === 'p2' ? '#ffaa00' : '#00ffff'
        );
    }

    fireSpecialMissile() {
        if (this.specialMissiles <= 0) return;
        this.specialMissiles--;
        this.weapons.fireHomingMissiles(this.mesh.position, [], 2, this.playerId);
        this.effects.createFloatingText(
            this.mesh.position,
            `${this.callsign} MISSILES!`,
            this.playerId === 'p2' ? '#ff3344' : '#aa00ff'
        );
    }

    takeDamage(amount) {
        this.shieldTimer = 0;

        if (this.shield > 0) {
            this.audio.playShieldHit();
            this.flashShield();
            if (this.shield >= amount) {
                this.shield -= amount;
                amount = 0;
            } else {
                amount -= this.shield;
                this.shield = 0;
                this.effects.createFloatingText(this.mesh.position, `${this.callsign} SHIELD DOWN!`, '#ff3344');
            }
        }

        if (amount > 0) {
            this.health = Math.max(0, this.health - amount);
            this.audio.playPlayerHit();
            this.effects.addScreenShake(0.85);

            this.isDamaged = true;
            this.damageFlashTimer = 0.25;

            if (this.health <= 0) {
                this.die();
            }
        }
    }

    flashShield() {
        if (!this.shieldMesh) return;
        gsap.killTweensOf(this.shieldMesh.material);
        this.shieldMesh.material.opacity = 0.85;
        gsap.to(this.shieldMesh.material, {
            opacity: 0,
            duration: 0.35,
            ease: 'power2.out'
        });
    }

    applyPowerup(type) {
        this.audio.playPowerupPickup();

        switch (type) {
            case 'health':
                this.health = Math.min(this.maxHealth, this.health + 40);
                this.effects.createFloatingText(this.mesh.position, `+40 HULL (${this.callsign})`, '#00ff88');
                break;
            case 'shield':
                this.shield = this.maxShield;
                this.flashShield();
                this.effects.createFloatingText(this.mesh.position, `SHIELDS MAX (${this.callsign})`, '#00d4ff');
                break;
            case 'double':
                this.currentWeapon = 'double';
                this.effects.createFloatingText(this.mesh.position, `DUAL BLASTER (${this.callsign})`, '#ff6600');
                break;
            case 'plasma':
                this.currentWeapon = 'plasma';
                this.effects.createFloatingText(this.mesh.position, `PLASMA CANNON (${this.callsign})`, '#33ff33');
                break;
            case 'rapid':
                this.currentWeapon = 'rapid';
                this.effects.createFloatingText(this.mesh.position, `HYPER GATLING (${this.callsign})`, '#ffea00');
                break;
            case 'beam':
                this.currentWeapon = 'beam';
                this.effects.createFloatingText(this.mesh.position, `ION RAILGUN (${this.callsign})`, '#ff00ff');
                break;
            case 'missile':
                this.specialMissiles = Math.min(this.maxSpecialMissiles, this.specialMissiles + 3);
                this.airBlasts = Math.min(this.maxAirBlasts, this.airBlasts + 2);
                this.effects.createFloatingText(this.mesh.position, `ORDNANCE CACHE (${this.callsign})`, '#aa00ff');
                break;
            case 'boost':
                this.boost = this.maxBoost;
                this.effects.createFloatingText(this.mesh.position, `AFTERBURNER MAX (${this.callsign})`, '#ffffff');
                break;
        }
    }

    die() {
        this.effects.createExplosion(this.mesh.position, 2.5, this.playerId === 'p2' ? 'fire' : 'blue');
        this.audio.playExplosion('large');
        this.lives--;

        if (this.lives > 0) {
            this.health = this.maxHealth;
            this.shield = this.maxShield;
            this.mesh.position.set(this.playerId === 'p1' ? -12 : 12, 0, 0);
            this.velocity.set(0, 0, 0);
            this.flashShield();
            this.effects.createFloatingText(this.mesh.position, `${this.callsign} REBOOT (${this.lives} LIVES)`, '#ffff00');
        }
    }

    // ==========================================
    // UPDATE LOOP & AERIAL DYNAMICS
    // ==========================================

    update(delta) {
        // Boost / Afterburner handling
        if (this.keys.boost && this.boost > 5) {
            if (!this.isBoosting) {
                this.audio.playSonicBoom();
                this.effects.createShockwave(this.mesh.position, 12, this.playerId === 'p2' ? 0xffaa00 : 0x00ffff);
            }
            this.isBoosting = true;
            this.boost = Math.max(0, this.boost - this.boostDrainRate * delta);
            this.effects.setWarpSpeed(true);
        } else {
            this.isBoosting = false;
            this.boost = Math.min(this.maxBoost, this.boost + this.boostRechargeRate * delta);
            this.effects.setWarpSpeed(false);
        }

        const currentSpeed = this.baseSpeed * (this.isBoosting ? this.boostMultiplier : 1.0);

        // Movement Inputs
        const moveDir = new THREE.Vector3(0, 0, 0);
        if (this.mouseControl && this.playerId === 'p1') {
            moveDir.x = (this.mouseTarget.x - this.mesh.position.x) * 2.5;
            moveDir.y = (this.mouseTarget.y - this.mesh.position.y) * 2.5;
        } else {
            if (this.keys.left) moveDir.x -= 1;
            if (this.keys.right) moveDir.x += 1;
            if (this.keys.up) moveDir.y += 1;
            if (this.keys.down) moveDir.y -= 1;
        }

        if (moveDir.lengthSq() > 1) {
            moveDir.normalize();
        }

        // Apply smooth air inertia & acceleration
        this.velocity.lerp(moveDir.multiplyScalar(currentSpeed), 12 * delta);
        this.mesh.position.addScaledVector(this.velocity, delta);

        // Flight boundaries
        this.mesh.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.mesh.position.x));
        this.mesh.position.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.mesh.position.y));
        this.mesh.position.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.mesh.position.z));

        // 3D Banking & Turning Animations
        const targetRoll = - (this.velocity.x / currentSpeed) * this.bankAngle;
        const targetPitch = (this.velocity.y / currentSpeed) * 0.28;
        const targetYaw = - (this.velocity.x / currentSpeed) * 0.22;

        this.mesh.rotation.z += (targetRoll - this.mesh.rotation.z) * 10 * delta;
        this.mesh.rotation.x += (targetPitch - this.mesh.rotation.x) * 10 * delta;
        this.mesh.rotation.y += (targetYaw - this.mesh.rotation.y) * 8 * delta;

        // Wingtip aerodynamic vapor contrails when turning hard in the air
        const turnIntensity = Math.abs(this.velocity.x) / currentSpeed;
        if (turnIntensity > 0.45 && Math.random() < 0.6) {
            for (const fin of this.wingtips) {
                const worldPos = new THREE.Vector3();
                fin.getWorldPosition(worldPos);
                this.effects.createMissileSmoke(worldPos);
            }
        }

        // Thruster Flames
        const flameScaleZ = (this.isBoosting ? 2.2 : 1.0) + Math.sin(performance.now() * 0.03) * 0.15;
        for (const flame of this.thrusterFlames) {
            flame.scale.set(1, 1, flameScaleZ);
        }

        // Engine particle trail emission
        if (Math.random() < 0.65) {
            const trailOffset = new THREE.Vector3(0, 0, 3.2).applyQuaternion(this.mesh.quaternion);
            this.effects.createEngineTrail(
                this.mesh.position.clone().add(trailOffset),
                this.playerId === 'p2' ? 0xff6600 : 0x00ccff,
                0.9,
                this.isBoosting
            );
        }

        // Shooting
        if (this.keys.fire) {
            this.shoot();
        }

        // Shield regeneration
        this.shieldTimer += delta;
        if (this.shieldTimer >= this.shieldRechargeDelay && this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * delta);
        }

        // Critical Damage Smoke
        if (this.health < this.maxHealth * 0.35 && Math.random() < 0.3) {
            this.effects.createMissileSmoke(this.mesh.position);
        }

        if (this.isDamaged) {
            this.damageFlashTimer -= delta;
            if (this.damageFlashTimer <= 0) {
                this.isDamaged = false;
            }
        }
    }

    reset(startX = 0) {
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.boost = this.maxBoost;
        this.specialMissiles = 5;
        this.airBlasts = 3;
        this.lives = 3;
        this.score = 0;
        this.multiplier = 1;
        this.currentWeapon = 'laser';
        this.mesh.position.set(startX, 0, 0);
        this.velocity.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
    }
}

window.Player = Player;
