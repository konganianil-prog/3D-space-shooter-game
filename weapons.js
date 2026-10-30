/**
 * GALAXY WARRIORS - 3D Space Shooter
 * weapons.js: Weapon Systems, Projectile Pooling, Homing Missiles & 3D Power-ups
 */

class WeaponManager {
    constructor(scene, effects, audio) {
        this.scene = scene;
        this.effects = effects;
        this.audio = audio;

        // Player Projectiles
        this.projectiles = [];
        this.missiles = [];

        // Enemy Projectiles
        this.enemyProjectiles = [];

        // Collectible Power-ups
        this.powerups = [];

        // Active Air Blasts / Sonic Shockwaves
        this.airBlasts = [];

        // Weapon Definitions & Configurations
        this.weaponTypes = {
            laser: {
                name: 'Twin Laser',
                damage: 18,
                speed: 160,
                fireRate: 0.16,
                color: 0x00d4ff,
                sound: 'blue'
            },
            air_blast: {
                name: 'Air Vortex Cannon',
                damage: 110,
                speed: 110,
                fireRate: 0.65,
                color: 0x88eeff,
                sound: 'air',
                isAir: true
            },
            double: {
                name: 'Dual Blaster',
                damage: 22,
                speed: 170,
                fireRate: 0.18,
                color: 0x00f0ff,
                sound: 'blue'
            },
            plasma: {
                name: 'Plasma Cannon',
                damage: 55,
                speed: 120,
                fireRate: 0.38,
                color: 0x00ff88,
                sound: 'plasma',
                radius: 1.2,
                splash: 8
            },
            rapid: {
                name: 'Hyper Gatling',
                damage: 12,
                speed: 190,
                fireRate: 0.08,
                color: 0xffcc00,
                sound: 'rapid'
            },
            beam: {
                name: 'Ion Railgun',
                damage: 90,
                speed: 260,
                fireRate: 0.55,
                color: 0xff00cc,
                sound: 'beam',
                piercing: true
            }
        };

        // Shared geometries & materials for object pooling performance
        this.geometries = {
            laser: new THREE.CylinderGeometry(0.14, 0.14, 2.8, 8),
            plasma: new THREE.SphereGeometry(0.65, 12, 12),
            missile: this.createMissileGeometry(),
            enemyLaser: new THREE.CylinderGeometry(0.18, 0.18, 2.5, 8),
            enemyPlasma: new THREE.SphereGeometry(0.7, 12, 12),
            powerup: new THREE.OctahedronGeometry(1.2, 0)
        };
        // Rotate laser cylinder to align along Z axis
        this.geometries.laser.rotateX(Math.PI / 2);
        this.geometries.enemyLaser.rotateX(Math.PI / 2);

        this.materials = {
            blueLaser: new THREE.MeshBasicMaterial({ color: 0x00d4ff }),
            cyanLaser: new THREE.MeshBasicMaterial({ color: 0x00ffff }),
            greenPlasma: new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
            yellowRapid: new THREE.MeshBasicMaterial({ color: 0xffea00 }),
            magentaBeam: new THREE.MeshBasicMaterial({ color: 0xff00dd }),
            redEnemy: new THREE.MeshBasicMaterial({ color: 0xff1144 }),
            orangeEnemyPlasma: new THREE.MeshBasicMaterial({ color: 0xff6600 })
        };
    }

    createMissileGeometry() {
        const group = new THREE.BufferGeometry();
        // Rocket body
        const bodyGeom = new THREE.CylinderGeometry(0.25, 0.25, 1.8, 8);
        bodyGeom.rotateX(Math.PI / 2);
        return bodyGeom;
    }

    // ==========================================
    // PLAYER SHOOTING
    // ==========================================

    firePlayerWeapon(type, origin, spreadMultiplier = 1, damageMultiplier = 1, owner = 'p1') {
        const config = this.weaponTypes[type] || this.weaponTypes.laser;
        const totalDamage = config.damage * damageMultiplier;
        const laserColor = owner === 'p2' ? this.materials.redEnemy : this.materials.blueLaser;

        if (type === 'laser') {
            // Twin dual lasers
            this.spawnPlayerLaser(new THREE.Vector3(origin.x - 1.2, origin.y - 0.2, origin.z - 1.5), config, totalDamage, owner, laserColor);
            this.spawnPlayerLaser(new THREE.Vector3(origin.x + 1.2, origin.y - 0.2, origin.z - 1.5), config, totalDamage, owner, laserColor);
            this.audio.playLaser(config.sound);
        } else if (type === 'air_blast') {
            this.spawnAirBlast(origin, owner);
        } else if (type === 'double') {
            // Dual laser + center bolt
            this.spawnPlayerLaser(new THREE.Vector3(origin.x - 1.4, origin.y, origin.z - 1.5), config, totalDamage, owner, laserColor);
            this.spawnPlayerLaser(new THREE.Vector3(origin.x + 1.4, origin.y, origin.z - 1.5), config, totalDamage, owner, laserColor);
            this.spawnPlayerLaser(new THREE.Vector3(origin.x, origin.y + 0.3, origin.z - 2.0), config, totalDamage * 0.8, owner, laserColor);
            this.audio.playLaser(config.sound);
        } else if (type === 'plasma') {
            // Heavy green plasma sphere
            this.spawnPlayerPlasma(new THREE.Vector3(origin.x, origin.y, origin.z - 2.0), config, totalDamage, owner);
            this.audio.playLaser(config.sound);
        } else if (type === 'rapid') {
            // Alternating rapid gatling
            const side = (Math.random() > 0.5 ? 1 : -1) * 0.8;
            this.spawnPlayerLaser(new THREE.Vector3(origin.x + side, origin.y - 0.2, origin.z - 1.8), config, totalDamage, owner, laserColor);
            this.audio.playLaser(config.sound);
        } else if (type === 'beam') {
            // High energy penetrating railgun beam
            this.spawnPlayerBeam(new THREE.Vector3(origin.x, origin.y, origin.z - 2.5), config, totalDamage, owner);
            this.audio.playLaser(config.sound);
        }
    }

    spawnAirBlast(pos, owner = 'p1') {
        this.audio.playAirBlast();
        this.effects.addScreenShake(0.7);

        // 3D Air Torus / Concussive Pressure Ring
        const ringGeom = new THREE.TorusGeometry(2.0, 0.45, 12, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: owner === 'p2' ? 0xffaa00 : 0x88ffff,
            transparent: true,
            opacity: 0.9,
            wireframe: true,
            blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(ringGeom, ringMat);
        mesh.position.copy(pos).add(new THREE.Vector3(0, 0, -2));
        this.scene.add(mesh);

        this.airBlasts.push({
            mesh: mesh,
            owner: owner,
            radius: 2.0,
            maxRadius: 18.0,
            expandSpeed: 24.0,
            forwardSpeed: 90.0,
            damage: 110,
            life: 0.85
        });

        // Air shockwave particle burst
        this.effects.createShockwave(pos, 16, owner === 'p2' ? 0xffaa00 : 0x00f0ff);
    }

    spawnPlayerLaser(pos, config, damage, owner = 'p1', customMat = null) {
        const mat = customMat || this.materials.blueLaser;
        const mesh = new THREE.Mesh(this.geometries.laser, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, -config.speed),
            damage: damage,
            life: 2.0,
            radius: 0.7,
            piercing: false,
            owner: owner
        });
    }

    spawnPlayerPlasma(pos, config, damage, owner = 'p1') {
        const mesh = new THREE.Mesh(this.geometries.plasma, this.materials.greenPlasma);
        mesh.position.copy(pos);
        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, -config.speed),
            damage: damage,
            life: 2.2,
            radius: 1.4,
            splash: config.splash,
            isPlasma: true,
            owner: owner
        });
    }

    spawnPlayerBeam(pos, config, damage, owner = 'p1') {
        const geom = new THREE.CylinderGeometry(0.35, 0.35, 6.0, 8);
        geom.rotateX(Math.PI / 2);
        const mesh = new THREE.Mesh(geom, this.materials.magentaBeam);
        mesh.position.copy(pos);
        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, -config.speed),
            damage: damage,
            life: 1.5,
            radius: 1.6,
            piercing: true,
            owner: owner
        });
    }

    // ==========================================
    // HOMING MISSILE SYSTEM
    // ==========================================

    fireHomingMissiles(origin, targetList, count = 2, owner = 'p1') {
        this.audio.playMissileLaunch();

        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: owner === 'p2' ? 0xff4422 : 0xeeeeee,
                metalness: 0.8,
                roughness: 0.3,
                emissive: owner === 'p2' ? 0xff6600 : 0x9900ff,
                emissiveIntensity: 0.6
            });
            const mesh = new THREE.Mesh(this.geometries.missile, mat);

            const sideOffset = (i === 0 ? -2.2 : 2.2);
            mesh.position.set(origin.x + sideOffset, origin.y, origin.z);

            // Initial outwards burst velocity
            const vel = new THREE.Vector3(
                sideOffset * 8,
                (Math.random() - 0.5) * 6,
                -25
            );

            this.scene.add(mesh);
            this.missiles.push({
                mesh: mesh,
                velocity: vel,
                speed: 85,
                turnRate: 4.8,
                damage: 85,
                life: 3.5,
                radius: 1.2,
                target: null, // dynamically assigned in update
                owner: owner
            });
        }
    }

    // ==========================================
    // ENEMY PROJECTILES
    // ==========================================

    spawnEnemyLaser(pos, direction, speed = 90, damage = 12) {
        const mesh = new THREE.Mesh(this.geometries.enemyLaser, this.materials.redEnemy);
        mesh.position.copy(pos);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction.clone().normalize());

        this.scene.add(mesh);
        this.enemyProjectiles.push({
            mesh: mesh,
            velocity: direction.clone().normalize().multiplyScalar(speed),
            damage: damage,
            life: 3.0,
            radius: 0.8
        });

        this.audio.playLaser('enemy');
    }

    spawnEnemyPlasma(pos, direction, speed = 65, damage = 25) {
        const mesh = new THREE.Mesh(this.geometries.enemyPlasma, this.materials.orangeEnemyPlasma);
        mesh.position.copy(pos);

        this.scene.add(mesh);
        this.enemyProjectiles.push({
            mesh: mesh,
            velocity: direction.clone().normalize().multiplyScalar(speed),
            damage: damage,
            life: 3.5,
            radius: 1.2,
            isPlasma: true
        });

        this.audio.playLaser('plasma');
    }

    // ==========================================
    // 3D COLLECTIBLE POWER-UPS
    // ==========================================

    spawnPowerup(pos, type = null) {
        const types = ['health', 'shield', 'double', 'plasma', 'rapid', 'beam', 'missile', 'boost'];
        const chosenType = type || types[Math.floor(Math.random() * types.length)];

        let color = 0x00ff88; // health green
        if (chosenType === 'shield') color = 0x00d4ff;
        else if (chosenType === 'double') color = 0xff6600;
        else if (chosenType === 'plasma') color = 0x33ff33;
        else if (chosenType === 'rapid') color = 0xffea00;
        else if (chosenType === 'beam') color = 0xff00ff;
        else if (chosenType === 'missile') color = 0xaa00ff;
        else if (chosenType === 'boost') color = 0xffffff;

        const group = new THREE.Group();

        // Glowing crystal octahedron
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.9,
            wireframe: false
        });
        const crystal = new THREE.Mesh(this.geometries.powerup, mat);
        group.add(crystal);

        // Surrounding orbital wireframe ring
        const ringGeom = new THREE.TorusGeometry(1.6, 0.08, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        group.add(ring);

        group.position.copy(pos);
        this.scene.add(group);

        this.powerups.push({
            group: group,
            crystal: crystal,
            ring: ring,
            type: chosenType,
            speed: 18,
            radius: 2.2,
            life: 14.0
        });
    }

    // ==========================================
    // UPDATE LOOP & HOMING AI
    // ==========================================

    update(delta, enemyList = [], boss = null) {
        // Update Air Blasts / Concussive Vortex Rings
        for (let i = this.airBlasts.length - 1; i >= 0; i--) {
            const ab = this.airBlasts[i];
            ab.life -= delta;
            ab.radius += ab.expandSpeed * delta;
            ab.mesh.scale.set(ab.radius / 2.0, ab.radius / 2.0, 1.0);
            ab.mesh.position.z -= ab.forwardSpeed * delta;

            // Deflect nearby enemy projectiles caught in the blast wave
            for (let epIdx = this.enemyProjectiles.length - 1; epIdx >= 0; epIdx--) {
                const ep = this.enemyProjectiles[epIdx];
                if (ep.mesh.position.distanceTo(ab.mesh.position) < ab.radius + 2.0) {
                    this.effects.createExplosion(ep.mesh.position, 0.5, 'spark');
                    this.scene.remove(ep.mesh);
                    this.enemyProjectiles.splice(epIdx, 1);
                }
            }

            if (ab.life <= 0 || ab.mesh.position.z < -300) {
                this.scene.remove(ab.mesh);
                this.airBlasts.splice(i, 1);
            }
        }

        // 1. Update player standard projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.mesh.position.addScaledVector(p.velocity, delta);
            p.life -= delta;

            if (p.life <= 0 || p.mesh.position.z < -350) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }

        // 2. Update homing missiles
        // Find candidate targets combining enemies and boss
        const validTargets = [];
        for (const e of enemyList) {
            if (e.hp > 0 && e.mesh.position.z > -280 && e.mesh.position.z < 20) {
                validTargets.push({ mesh: e.mesh, hp: e.hp });
            }
        }
        if (boss && boss.active && boss.hp > 0) {
            validTargets.push({ mesh: boss.mesh, hp: boss.hp });
        }

        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const m = this.missiles[i];
            m.life -= delta;

            // Retarget nearest valid enemy if current target is invalid
            if (!m.target || m.target.hp <= 0) {
                let closestDist = Infinity;
                let bestTarget = null;
                for (const t of validTargets) {
                    const d = m.mesh.position.distanceTo(t.mesh.position);
                    if (d < closestDist) {
                        closestDist = d;
                        bestTarget = t;
                    }
                }
                m.target = bestTarget;
            }

            // Homing vector steering
            if (m.target && m.target.mesh) {
                const targetDir = new THREE.Vector3().subVectors(m.target.mesh.position, m.mesh.position).normalize();
                m.velocity.lerp(targetDir.multiplyScalar(m.speed), m.turnRate * delta);
            } else {
                // Fly straight forward
                m.velocity.z = -m.speed;
            }

            m.mesh.position.addScaledVector(m.velocity, delta);
            m.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), m.velocity.clone().normalize());

            // Emit missile smoke trail
            if (Math.random() < 0.8) {
                this.effects.createMissileSmoke(m.mesh.position);
            }

            if (m.life <= 0 || m.mesh.position.z < -350) {
                this.effects.createExplosion(m.mesh.position, 0.8, 'fire');
                this.scene.remove(m.mesh);
                this.missiles.splice(i, 1);
            }
        }

        // 3. Update enemy projectiles
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const ep = this.enemyProjectiles[i];
            ep.mesh.position.addScaledVector(ep.velocity, delta);
            ep.life -= delta;

            if (ep.life <= 0 || ep.mesh.position.z > 40) {
                this.scene.remove(ep.mesh);
                this.enemyProjectiles.splice(i, 1);
            }
        }

        // 4. Update power-ups (float toward player, rotate, bob)
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.life -= delta;
            pu.group.position.z += pu.speed * delta;
            pu.crystal.rotation.x += 1.8 * delta;
            pu.crystal.rotation.y += 2.2 * delta;
            pu.ring.rotation.x += 1.2 * delta;
            pu.ring.rotation.z += 1.5 * delta;

            if (pu.life <= 0 || pu.group.position.z > 35) {
                this.scene.remove(pu.group);
                this.powerups.splice(i, 1);
            }
        }
    }

    clearAll() {
        for (const ab of this.airBlasts) this.scene.remove(ab.mesh);
        this.airBlasts = [];
        for (const p of this.projectiles) this.scene.remove(p.mesh);
        this.projectiles = [];
        for (const m of this.missiles) this.scene.remove(m.mesh);
        this.missiles = [];
        for (const ep of this.enemyProjectiles) this.scene.remove(ep.mesh);
        this.enemyProjectiles = [];
        for (const pu of this.powerups) this.scene.remove(pu.group);
        this.powerups = [];
    }
}

window.WeaponManager = WeaponManager;
