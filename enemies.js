/**
 * GALAXY WARRIORS - 3D Space Shooter
 * enemies.js: Alien Enemy Fleets, Procedural 3D Ships, Formations & AI Behaviors
 */

class EnemyManager {
    constructor(scene, weapons, effects, audio) {
        this.scene = scene;
        this.weapons = weapons;
        this.effects = effects;
        this.audio = audio;

        this.enemies = [];
        this.waveTimer = 0;
        this.currentWave = 1;
        this.currentLevel = 1;

        // Shared geometries for enemy models
        this.geometries = {
            fighterBody: this.createFighterGeometry(),
            heavyBody: new THREE.BoxGeometry(3.5, 1.8, 6.0),
            alienBody: new THREE.ConeGeometry(1.6, 5.0, 5),
            kamikazeBody: new THREE.ConeGeometry(1.1, 4.2, 4)
        };
        this.geometries.alienBody.rotateX(Math.PI / 2);
        this.geometries.kamikazeBody.rotateX(Math.PI / 2);

        // Enemy materials
        this.materials = {
            fighter: new THREE.MeshStandardMaterial({
                color: 0x4a1820,
                metalness: 0.8,
                roughness: 0.3,
                emissive: 0xff0033,
                emissiveIntensity: 0.4
            }),
            heavy: new THREE.MeshStandardMaterial({
                color: 0x222938,
                metalness: 0.9,
                roughness: 0.4,
                emissive: 0x0088ff,
                emissiveIntensity: 0.3
            }),
            alien: new THREE.MeshStandardMaterial({
                color: 0x1b3820,
                metalness: 0.7,
                roughness: 0.2,
                emissive: 0x00ff66,
                emissiveIntensity: 0.5
            }),
            kamikaze: new THREE.MeshStandardMaterial({
                color: 0x551100,
                metalness: 0.9,
                roughness: 0.2,
                emissive: 0xff3300,
                emissiveIntensity: 0.7
            }),
            elite: new THREE.MeshStandardMaterial({
                color: 0x2d123d,
                metalness: 0.85,
                roughness: 0.25,
                emissive: 0xcc00ff,
                emissiveIntensity: 0.6
            })
        };
    }

    createFighterGeometry() {
        const geom = new THREE.ConeGeometry(1.4, 4.5, 6);
        geom.rotateX(Math.PI / 2);
        return geom;
    }

    // ==========================================
    // PROCEDURAL ENEMY SHIP ASSEMBLY
    // ==========================================

    buildEnemyShip(type) {
        const group = new THREE.Group();

        if (type === 'fighter') {
            // Small fast fighter
            const body = new THREE.Mesh(this.geometries.fighterBody, this.materials.fighter);
            group.add(body);

            // Red glowing engine
            const engineGeom = new THREE.CylinderGeometry(0.3, 0.4, 1.0, 8);
            engineGeom.rotateX(Math.PI / 2);
            const engine = new THREE.Mesh(engineGeom, new THREE.MeshBasicMaterial({ color: 0xff2200 }));
            engine.position.set(0, 0, -2.4);
            group.add(engine);

        } else if (type === 'heavy') {
            // Armored cruiser with side weapon pods
            const body = new THREE.Mesh(this.geometries.heavyBody, this.materials.heavy);
            group.add(body);

            for (const side of [-2.4, 2.4]) {
                const podGeom = new THREE.CylinderGeometry(0.5, 0.5, 4.5, 8);
                podGeom.rotateX(Math.PI / 2);
                const pod = new THREE.Mesh(podGeom, this.materials.heavy);
                pod.position.set(side, 0, 0);
                group.add(pod);

                // Plasma cannon barrel
                const barrelGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 8);
                barrelGeom.rotateX(Math.PI / 2);
                const barrel = new THREE.Mesh(barrelGeom, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
                barrel.position.set(side, -0.2, 2.6);
                group.add(barrel);
            }

        } else if (type === 'alien') {
            // Bio-mechanical alien interceptor with crystalline wings
            const body = new THREE.Mesh(this.geometries.alienBody, this.materials.alien);
            group.add(body);

            // Crystalline side fins
            for (const side of [-1, 1]) {
                const finGeom = new THREE.BoxGeometry(2.4, 0.1, 1.8);
                const fin = new THREE.Mesh(finGeom, new THREE.MeshBasicMaterial({
                    color: 0x00ff88,
                    wireframe: true
                }));
                fin.position.set(side * 1.8, 0, 0);
                group.add(fin);
            }

        } else if (type === 'kamikaze') {
            // Needle-shaped suicide rammer with flashing red core
            const body = new THREE.Mesh(this.geometries.kamikazeBody, this.materials.kamikaze);
            group.add(body);

            const coreGeom = new THREE.SphereGeometry(0.5, 8, 8);
            const core = new THREE.Mesh(coreGeom, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            core.position.set(0, 0, 0.5);
            group.add(core);
            group.userData.pulsingCore = core;

        } else if (type === 'elite') {
            // Shielded elite marauder
            const body = new THREE.Mesh(this.geometries.heavyBody, this.materials.elite);
            body.scale.set(0.9, 0.8, 0.9);
            group.add(body);

            // Shield bubble
            const shieldGeom = new THREE.SphereGeometry(3.2, 16, 16);
            const shieldMat = new THREE.MeshBasicMaterial({
                color: 0xcc00ff,
                transparent: true,
                opacity: 0.35,
                wireframe: true
            });
            const shield = new THREE.Mesh(shieldGeom, shieldMat);
            group.add(shield);
            group.userData.shieldMesh = shield;
        }

        return group;
    }

    // ==========================================
    // ENEMY SPAWNERS & FORMATIONS
    // ==========================================

    spawnEnemy(type, startPos, options = {}) {
        const mesh = this.buildEnemyShip(type);
        mesh.position.copy(startPos);
        this.scene.add(mesh);

        // Stats based on type and level difficulty
        const lvlMod = 1 + (this.currentLevel - 1) * 0.25;
        let hp = 30 * lvlMod;
        let scoreVal = 100;
        let speed = 25;
        let shootInterval = 2.2 / Math.min(2.5, lvlMod);

        if (type === 'heavy') {
            hp = 140 * lvlMod;
            scoreVal = 350;
            speed = 14;
            shootInterval = 1.8;
        } else if (type === 'alien') {
            hp = 55 * lvlMod;
            scoreVal = 220;
            speed = 32;
            shootInterval = 1.4;
        } else if (type === 'kamikaze') {
            hp = 25 * lvlMod;
            scoreVal = 150;
            speed = 46;
            shootInterval = 999; // doesn't shoot, only rams!
        } else if (type === 'elite') {
            hp = 200 * lvlMod;
            scoreVal = 600;
            speed = 20;
            shootInterval = 1.2;
        }

        this.enemies.push({
            mesh: mesh,
            type: type,
            hp: hp,
            maxHp: hp,
            shield: type === 'elite' ? 60 * lvlMod : 0,
            scoreValue: scoreVal,
            speed: speed,
            shootInterval: shootInterval,
            shootTimer: Math.random() * shootInterval,
            behavior: options.behavior || 'swoop',
            flightPhase: Math.random() * Math.PI * 2,
            targetOffsetX: options.offsetX || 0,
            radius: type === 'heavy' || type === 'elite' ? 3.0 : 1.8,
            dodgeCooldown: 0
        });
    }

    spawnFormation(pattern = 'v_formation', type = 'fighter') {
        const zSpawn = -260;
        const centerX = (Math.random() - 0.5) * 40;

        if (pattern === 'v_formation') {
            const offsets = [
                { x: 0, z: 0 },
                { x: -6, z: -10 },
                { x: 6, z: -10 },
                { x: -12, z: -20 },
                { x: 12, z: -20 }
            ];
            for (const off of offsets) {
                this.spawnEnemy(type, new THREE.Vector3(centerX + off.x, (Math.random() - 0.5) * 8, zSpawn + off.z), {
                    behavior: 'swoop',
                    offsetX: off.x
                });
            }
        } else if (pattern === 'line') {
            const count = 4;
            for (let i = 0; i < count; i++) {
                const x = (i - (count - 1) / 2) * 12;
                this.spawnEnemy(type, new THREE.Vector3(x, 10, zSpawn), {
                    behavior: 'dive'
                });
            }
        } else if (pattern === 'pincer') {
            // Flanking attacks from left and right
            this.spawnEnemy(type, new THREE.Vector3(-45, 5, zSpawn), { behavior: 'flank_left' });
            this.spawnEnemy(type, new THREE.Vector3(45, 5, zSpawn), { behavior: 'flank_right' });
            if (this.currentLevel >= 3) {
                this.spawnEnemy('heavy', new THREE.Vector3(0, -4, zSpawn - 20), { behavior: 'cruiser' });
            }
        } else if (pattern === 'kamikaze_swarm') {
            const count = 3 + this.currentLevel;
            for (let i = 0; i < count; i++) {
                const x = (Math.random() - 0.5) * 50;
                const y = (Math.random() - 0.5) * 20;
                this.spawnEnemy('kamikaze', new THREE.Vector3(x, y, zSpawn - i * 15), {
                    behavior: 'kamikaze'
                });
            }
        }
    }

    // ==========================================
    // AI LOGIC & UPDATE LOOP
    // ==========================================

    update(delta, player, playerProjectiles = []) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.flightPhase += delta * 2.2;
            e.shootTimer += delta;
            e.dodgeCooldown -= delta;

            const toPlayer = new THREE.Vector3().subVectors(player.mesh.position, e.mesh.position);

            // 1. Bullet Evasion Logic (dodging incoming fire)
            if (e.dodgeCooldown <= 0 && playerProjectiles.length > 0) {
                for (const p of playerProjectiles) {
                    if (p.mesh.position.z < e.mesh.position.z && e.mesh.position.z - p.mesh.position.z < 45) {
                        const distToTrajectory = Math.abs(p.mesh.position.x - e.mesh.position.x);
                        if (distToTrajectory < 4.0) {
                            // Dodge rapidly left or right
                            const dodgeDir = (e.mesh.position.x > p.mesh.position.x) ? 1 : -1;
                            e.mesh.position.x += dodgeDir * 18 * delta;
                            e.dodgeCooldown = 0.8;
                            break;
                        }
                    }
                }
            }

            // 2. Flight Behaviors
            if (e.behavior === 'swoop') {
                e.mesh.position.z += e.speed * delta;
                e.mesh.position.x += Math.sin(e.flightPhase) * 16 * delta;
                e.mesh.position.y += Math.cos(e.flightPhase * 0.8) * 8 * delta;

                // Aim toward player
                e.mesh.lookAt(player.mesh.position);
            } else if (e.behavior === 'dive') {
                e.mesh.position.z += e.speed * 1.3 * delta;
                e.mesh.position.y -= 14 * delta;
                e.mesh.lookAt(player.mesh.position);
            } else if (e.behavior === 'cruiser') {
                // Steady forward battle line
                e.mesh.position.z += e.speed * delta;
                e.mesh.position.x = e.targetOffsetX + Math.sin(e.flightPhase * 0.5) * 8;
                e.mesh.rotation.y = Math.PI; // Face forward
            } else if (e.behavior === 'flank_left') {
                e.mesh.position.z += e.speed * delta;
                e.mesh.position.x += 16 * delta;
                e.mesh.lookAt(player.mesh.position);
            } else if (e.behavior === 'flank_right') {
                e.mesh.position.z += e.speed * delta;
                e.mesh.position.x -= 16 * delta;
                e.mesh.lookAt(player.mesh.position);
            } else if (e.behavior === 'kamikaze') {
                // Accelerating tracking lock-on
                const ramDir = toPlayer.clone().normalize();
                e.mesh.position.addScaledVector(ramDir, e.speed * delta);
                e.mesh.lookAt(player.mesh.position);

                // Pulse red core warning
                if (e.mesh.userData.pulsingCore) {
                    const scale = 1.0 + Math.sin(performance.now() * 0.02) * 0.5;
                    e.mesh.userData.pulsingCore.scale.set(scale, scale, scale);
                }
            }

            // 3. Enemy Shooting AI
            if (e.shootTimer >= e.shootInterval && e.mesh.position.z < -10 && e.mesh.position.z > -220) {
                e.shootTimer = 0;
                const fireOrigin = e.mesh.position.clone();
                const aimDir = toPlayer.clone().normalize();

                if (e.type === 'fighter') {
                    this.weapons.spawnEnemyLaser(fireOrigin, aimDir, 95, 12);
                } else if (e.type === 'heavy') {
                    // Twin spread plasma
                    this.weapons.spawnEnemyPlasma(fireOrigin.clone().add(new THREE.Vector3(-1.8, 0, 0)), aimDir, 75, 24);
                    this.weapons.spawnEnemyPlasma(fireOrigin.clone().add(new THREE.Vector3(1.8, 0, 0)), aimDir, 75, 24);
                } else if (e.type === 'alien') {
                    // Fast triple burst
                    this.weapons.spawnEnemyLaser(fireOrigin, aimDir, 110, 15);
                } else if (e.type === 'elite') {
                    this.weapons.spawnEnemyPlasma(fireOrigin, aimDir, 85, 28);
                }
            }

            // 4. Collision with Player (Ramming)
            const distToPlayer = e.mesh.position.distanceTo(player.mesh.position);
            if (distToPlayer < e.radius + 2.0) {
                const ramDmg = e.type === 'kamikaze' ? 65 : 35;
                player.takeDamage(ramDmg);
                this.destroyEnemy(i, true);
                continue;
            }

            // 5. Clean up enemies that fly past the camera
            if (e.mesh.position.z > 35) {
                this.scene.remove(e.mesh);
                this.enemies.splice(i, 1);
            }
        }
    }

    damageEnemy(enemyIndex, amount) {
        const e = this.enemies[enemyIndex];
        if (!e) return false;

        // Shield absorption if elite
        if (e.shield > 0) {
            if (e.shield >= amount) {
                e.shield -= amount;
                amount = 0;
            } else {
                amount -= e.shield;
                e.shield = 0;
                if (e.mesh.userData.shieldMesh) {
                    e.mesh.userData.shieldMesh.visible = false;
                }
            }
        }

        e.hp -= amount;

        // Visual spark
        this.effects.createExplosion(e.mesh.position, 0.4, 'spark');

        if (e.hp <= 0) {
            this.destroyEnemy(enemyIndex);
            return true;
        }
        return false;
    }

    destroyEnemy(index, silent = false) {
        const e = this.enemies[index];
        if (!e) return;

        if (!silent) {
            const expSize = e.type === 'heavy' || e.type === 'elite' ? 2.2 : (e.type === 'kamikaze' ? 1.8 : 1.2);
            const expColor = e.type === 'alien' ? 'alien' : 'fire';
            this.effects.createExplosion(e.mesh.position, expSize, expColor);
            this.audio.playExplosion(e.type === 'heavy' ? 'large' : 'medium');
            this.effects.createFloatingText(e.mesh.position, `+${e.scoreValue}`, '#00ffcc');

            // Chance to drop power-up (30% drop chance)
            if (Math.random() < 0.32) {
                this.weapons.spawnPowerup(e.mesh.position);
            }
        }

        this.scene.remove(e.mesh);
        this.enemies.splice(index, 1);
    }

    clearAll() {
        for (const e of this.enemies) {
            this.scene.remove(e.mesh);
        }
        this.enemies = [];
    }
}

window.EnemyManager = EnemyManager;
