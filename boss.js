/**
 * GALAXY WARRIORS - 3D Space Shooter
 * boss.js: Giant 3D Alien Boss Dreadnoughts, Multi-Phase AI & Mega Beam Attacks
 */

class BossManager {
    constructor(scene, weapons, effects, audio) {
        this.scene = scene;
        this.weapons = weapons;
        this.effects = effects;
        this.audio = audio;

        this.boss = null;
        this.active = false;
        this.introPlaying = false;

        // Mega Beam components
        this.beamMesh = null;
        this.beamCharging = false;
        this.beamActive = false;
        this.beamChargeTimer = 0;
        this.beamDuration = 0;
    }

    // ==========================================
    // PROCEDURAL 3D MOTHERSHIP MODEL
    // ==========================================

    buildBossModel(type = 'destroyer') {
        const group = new THREE.Group();

        // Heavy dark armor materials
        const armorMat = new THREE.MeshStandardMaterial({
            color: 0x181420,
            metalness: 0.9,
            roughness: 0.25,
            flatShading: true
        });
        const glowingCoreMat = new THREE.MeshStandardMaterial({
            color: 0x9900ff,
            emissive: 0xaa00ff,
            emissiveIntensity: 1.2,
            roughness: 0.1
        });
        const hazardMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

        // 1. Massive Command Hull
        const hullGeom = new THREE.BoxGeometry(16, 6, 26);
        const hull = new THREE.Mesh(hullGeom, armorMat);
        group.add(hull);

        // 2. Heavy Outrigger Wings / Pontoons
        for (const side of [-1, 1]) {
            const wingGeom = new THREE.BoxGeometry(8, 4, 20);
            const wing = new THREE.Mesh(wingGeom, armorMat);
            wing.position.set(side * 12, -0.5, -2);
            group.add(wing);

            // Forward Mega Cannons
            const cannonGeom = new THREE.CylinderGeometry(1.0, 1.2, 10, 12);
            cannonGeom.rotateX(Math.PI / 2);
            const cannon = new THREE.Mesh(cannonGeom, armorMat);
            cannon.position.set(side * 12, -0.2, 11);
            group.add(cannon);

            // Red glowing weapon vents
            const ventGeom = new THREE.BoxGeometry(2, 0.4, 6);
            const vent = new THREE.Mesh(ventGeom, hazardMat);
            vent.position.set(side * 12, 1.8, 4);
            group.add(vent);
        }

        // 3. Central Dark Matter Core (Pulsing Sphere)
        const coreGeom = new THREE.SphereGeometry(3.5, 24, 24);
        const core = new THREE.Mesh(coreGeom, glowingCoreMat);
        core.position.set(0, 2.2, 0);
        group.add(core);
        group.userData.reactorCore = core;

        // 4. Rotating Orbital Containment Ring
        const ringGeom = new THREE.TorusGeometry(5.5, 0.4, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.set(0, 2.2, 0);
        group.add(ring);
        group.userData.orbitalRing = ring;

        // 5. Massive Forward Particle Beam Cannon Hardpoint
        const mouthGeom = new THREE.CylinderGeometry(2.5, 1.8, 5, 16);
        mouthGeom.rotateX(Math.PI / 2);
        const mouth = new THREE.Mesh(mouthGeom, armorMat);
        mouth.position.set(0, -0.5, 14);
        group.add(mouth);

        // 6. Boss Shield Bubble (Activates in Phase 2)
        const shieldGeom = new THREE.SphereGeometry(18, 32, 32);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0,
            wireframe: true,
            blending: THREE.AdditiveBlending
        });
        const shield = new THREE.Mesh(shieldGeom, shieldMat);
        group.add(shield);
        group.userData.shieldMesh = shield;

        return group;
    }

    // ==========================================
    // BOSS SPAWN & CINEMATIC INTRO
    // ==========================================

    spawnBoss(level = 5, onIntroComplete = null) {
        if (this.boss) {
            this.scene.remove(this.boss.mesh);
        }

        const mesh = this.buildBossModel();
        // Start deep in space
        mesh.position.set(0, 15, -300);
        this.scene.add(mesh);

        const hp = 1500 + level * 500;
        this.boss = {
            mesh: mesh,
            name: level === 5 ? "DARK GALAXY DESTROYER" : "GOLIATH TITAN DREADNOUGHT",
            hp: hp,
            maxHp: hp,
            phase: 1, // Phase 1 (100%-60%), Phase 2 (60%-30%), Phase 3 Enraged (<30%)
            attackTimer: 0,
            currentAttack: 'salvo',
            radius: 12.0,
            phaseTriggered2: false,
            phaseTriggered3: false
        };

        this.active = true;
        this.introPlaying = true;
        this.audio.playWarning();
        this.audio.setMusicMode('boss');

        // Cinematic Fly-in Animation via GSAP
        gsap.to(mesh.position, {
            x: 0,
            y: 4,
            z: -120,
            duration: 4.5,
            ease: 'power3.out',
            onComplete: () => {
                this.introPlaying = false;
                if (onIntroComplete) onIntroComplete();
            }
        });
    }

    // ==========================================
    // ATTACK PATTERNS & AI
    // ==========================================

    update(delta, player) {
        if (!this.active || !this.boss) return;

        // Animate reactor core & ring rotation
        if (this.boss.mesh.userData.reactorCore) {
            const pulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.15;
            this.boss.mesh.userData.reactorCore.scale.set(pulse, pulse, pulse);
        }
        if (this.boss.mesh.userData.orbitalRing) {
            this.boss.mesh.userData.orbitalRing.rotation.z += 1.8 * delta;
            this.boss.mesh.userData.orbitalRing.rotation.x += 1.2 * delta;
        }

        if (this.introPlaying) return;

        // Health-based Phase Transitions
        const hpPct = this.boss.hp / this.boss.maxHp;
        if (hpPct <= 0.6 && !this.boss.phaseTriggered2) {
            this.boss.phase = 2;
            this.boss.phaseTriggered2 = true;
            this.activateBossShield(true);
            this.effects.createFloatingText(this.boss.mesh.position, 'PHASE 2: DEFENSIVE SHIELDS ENGAGED!', '#00ffff');
            this.audio.playWarning();
        }
        if (hpPct <= 0.3 && !this.boss.phaseTriggered3) {
            this.boss.phase = 3;
            this.boss.phaseTriggered3 = true;
            this.activateBossShield(false); // Overloaded core exposed
            this.effects.createFloatingText(this.boss.mesh.position, 'PHASE 3: ENRAGED CORE OVERDRIVE!', '#ff0044');
            this.effects.addScreenShake(2.0);
            this.audio.playWarning();
        }

        // Smooth Sway Movement
        const swaySpeed = this.boss.phase === 3 ? 1.4 : 0.8;
        this.boss.mesh.position.x = Math.sin(performance.now() * 0.001 * swaySpeed) * 32;
        this.boss.mesh.position.y = 4 + Math.cos(performance.now() * 0.0008 * swaySpeed) * 8;

        // Attack Routine Timer
        this.boss.attackTimer += delta;
        const attackInterval = this.boss.phase === 3 ? 1.8 : (this.boss.phase === 2 ? 2.4 : 3.0);

        if (this.boss.attackTimer >= attackInterval) {
            this.boss.attackTimer = 0;
            this.executeAttackPattern(player);
        }

        // Update active Mega Beam Cannon
        if (this.beamActive && this.beamMesh) {
            this.beamDuration -= delta;
            this.beamMesh.position.copy(this.boss.mesh.position).add(new THREE.Vector3(0, -0.5, 70));

            // Check collision of mega beam with player
            const beamDistX = Math.abs(player.mesh.position.x - this.boss.mesh.position.x);
            const beamDistY = Math.abs(player.mesh.position.y - (this.boss.mesh.position.y - 0.5));
            if (beamDistX < 4.0 && beamDistY < 4.0) {
                player.takeDamage(60 * delta);
            }

            if (this.beamDuration <= 0) {
                this.stopMegaBeam();
            }
        }
    }

    executeAttackPattern(player) {
        const patterns = ['salvo', 'spread_missiles', 'mega_beam', 'plasma_bomb'];
        const chosen = patterns[Math.floor(Math.random() * patterns.length)];

        const toPlayer = new THREE.Vector3().subVectors(player.mesh.position, this.boss.mesh.position).normalize();

        if (chosen === 'salvo') {
            // Heavy quad-laser salvo from wing cannons
            for (const side of [-12, -4, 4, 12]) {
                const origin = this.boss.mesh.position.clone().add(new THREE.Vector3(side, -0.5, 12));
                this.weapons.spawnEnemyLaser(origin, toPlayer, 110, 18);
            }
        } else if (chosen === 'spread_missiles') {
            // Radial plasma spread
            for (let angle = -0.4; angle <= 0.4; angle += 0.2) {
                const dir = toPlayer.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                const origin = this.boss.mesh.position.clone().add(new THREE.Vector3(0, 0, 14));
                this.weapons.spawnEnemyPlasma(origin, dir, 75, 26);
            }
        } else if (chosen === 'mega_beam') {
            // Fire devastating forward ion beam
            this.fireMegaBeam();
        } else if (chosen === 'plasma_bomb') {
            // Massive explosive plasma spheres
            for (const side of [-8, 8]) {
                const origin = this.boss.mesh.position.clone().add(new THREE.Vector3(side, 1, 10));
                this.weapons.spawnEnemyPlasma(origin, toPlayer, 80, 35);
            }
        }
    }

    fireMegaBeam() {
        if (this.beamActive) return;
        this.beamActive = true;
        this.beamDuration = 2.4;

        // Visual 3D Mega Beam Cylinder stretching 200 units forward
        const beamGeom = new THREE.CylinderGeometry(2.8, 3.5, 160, 16);
        beamGeom.rotateX(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });

        this.beamMesh = new THREE.Mesh(beamGeom, beamMat);
        this.scene.add(this.beamMesh);
        this.effects.addScreenShake(1.5);
        this.audio.playLaser('beam');
    }

    stopMegaBeam() {
        if (this.beamMesh) {
            this.scene.remove(this.beamMesh);
            this.beamMesh.geometry.dispose();
            this.beamMesh.material.dispose();
            this.beamMesh = null;
        }
        this.beamActive = false;
    }

    activateBossShield(active) {
        if (!this.boss || !this.boss.mesh.userData.shieldMesh) return;
        gsap.to(this.boss.mesh.userData.shieldMesh.material, {
            opacity: active ? 0.45 : 0,
            duration: 1.0
        });
    }

    takeDamage(amount) {
        if (!this.active || !this.boss || this.boss.hp <= 0) return false;

        // In Phase 2, shield reduces incoming damage by 60%
        if (this.boss.phase === 2) {
            amount *= 0.4;
            this.effects.createExplosion(this.boss.mesh.position.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 6,
                10
            )), 0.6, 'blue');
        }

        this.boss.hp -= amount;
        this.effects.createExplosion(this.boss.mesh.position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 5,
            8
        )), 0.7, 'spark');

        if (this.boss.hp <= 0) {
            this.destroyBoss();
            return true;
        }
        return false;
    }

    // ==========================================
    // CINEMATIC BOSS DESTRUCTION
    // ==========================================

    destroyBoss() {
        this.active = false;
        this.stopMegaBeam();

        // Chained sequential explosions across hull
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                if (this.boss && this.boss.mesh) {
                    const offset = new THREE.Vector3(
                        (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 8,
                        (Math.random() - 0.5) * 20
                    );
                    this.effects.createExplosion(this.boss.mesh.position.clone().add(offset), 2.5, 'fire');
                    this.audio.playExplosion('large');
                }
            }, i * 180);
        }

        // Final supernova burst
        setTimeout(() => {
            if (this.boss && this.boss.mesh) {
                this.effects.createExplosion(this.boss.mesh.position, 6.0, 'blue');
                this.effects.createShockwave(this.boss.mesh.position, 60, 0x00ffff);
                this.audio.playExplosion('boss');
                this.audio.playVictory();
                this.scene.remove(this.boss.mesh);
                this.boss = null;
            }
        }, 3000);
    }

    clear() {
        this.stopMegaBeam();
        if (this.boss && this.boss.mesh) {
            this.scene.remove(this.boss.mesh);
        }
        this.boss = null;
        this.active = false;
    }
}

window.BossManager = BossManager;
