/**
 * GALAXY WARRIORS - 3D Space Shooter
 * effects.js: Visual Effects, High-Performance Particle Engine & Screen Shake
 */

class EffectsManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.92;
        this.cameraBasePos = new THREE.Vector3(0, 5, 20);
        this.cameraTargetLook = new THREE.Vector3(0, 0, -20);

        // Pre-generate procedural sprite textures
        this.textures = {
            glow: this.createGlowTexture(),
            spark: this.createSparkTexture(),
            smoke: this.createSmokeTexture(),
            ring: this.createRingTexture()
        };

        // Active particle pools
        this.particles = [];
        this.shockwaves = [];
        this.debrisList = [];
        this.floatingTexts = [];

        // Warp speed streak lines
        this.warpStreaks = null;
        this.warpActive = false;
        this.initWarpStreaks();
    }

    // ==========================================
    // PROCEDURAL TEXTURE GENERATION (Offline / Zero CORS)
    // ==========================================

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(200, 240, 255, 0.9)');
        grad.addColorStop(0.5, 'rgba(70, 160, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 50, 255, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    createSparkTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
        grad.addColorStop(0.3, 'rgba(255, 180, 50, 0.8)');
        grad.addColorStop(0.7, 'rgba(255, 60, 0, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    createSmokeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
        grad.addColorStop(0, 'rgba(180, 190, 210, 0.7)');
        grad.addColorStop(0.5, 'rgba(100, 110, 130, 0.35)');
        grad.addColorStop(1, 'rgba(20, 20, 30, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    createRingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 128, 128);
        ctx.beginPath();
        ctx.arc(64, 64, 52, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 220, 255, 0.9)';
        ctx.lineWidth = 14;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(64, 64, 52, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.lineWidth = 4;
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // ==========================================
    // WARP SPEED STREAKS
    // ==========================================

    initWarpStreaks() {
        const count = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 6); // 2 vertices per line
        const colors = new Float32Array(count * 6);

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 120;
            const y = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 200 - 50;

            positions[i * 6] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;

            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y;
            positions[i * 6 + 5] = z - 25; // Streak length

            const c = new THREE.Color(0x88ccff);
            colors[i * 6] = c.r;
            colors[i * 6 + 1] = c.g;
            colors[i * 6 + 2] = c.b;
            colors[i * 6 + 3] = 1;
            colors[i * 6 + 4] = 1;
            colors[i * 6 + 5] = 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        this.warpStreaks = new THREE.LineSegments(geometry, material);
        this.scene.add(this.warpStreaks);
    }

    setWarpSpeed(active) {
        this.warpActive = active;
        if (this.warpStreaks) {
            gsap.to(this.warpStreaks.material, {
                opacity: active ? 0.85 : 0,
                duration: 0.4
            });
        }
    }

    // ==========================================
    // EXPLOSIONS & SHOCKWAVES
    // ==========================================

    createExplosion(position, scale = 1, type = 'fire') {
        const count = Math.min(80, Math.floor(40 * scale));
        const colorPalette = type === 'alien' ?
            [0x88ff00, 0x00ffcc, 0xff00ff, 0xffffff] :
            (type === 'blue' ? [0x00ccff, 0x4488ff, 0xffffff, 0x88eeff] : [0xff3300, 0xff8800, 0xffdd00, 0xffffff]);

        for (let i = 0; i < count; i++) {
            const material = new THREE.SpriteMaterial({
                map: Math.random() > 0.4 ? this.textures.spark : this.textures.glow,
                color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 1
            });

            const sprite = new THREE.Sprite(material);
            sprite.position.copy(position);
            const size = (Math.random() * 2 + 1) * scale;
            sprite.scale.set(size, size, 1);

            const speed = (Math.random() * 35 + 15) * scale;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );

            this.scene.add(sprite);
            this.particles.push({
                mesh: sprite,
                velocity: velocity,
                drag: 0.94,
                scaleSpeed: 0.97,
                life: 1.0,
                decay: (Math.random() * 0.8 + 0.6) / scale
            });
        }

        // Add 3D Shockwave
        this.createShockwave(position, scale * 3.5, colorPalette[1]);

        // Add tumbling 3D Debris fragments
        const debrisCount = Math.floor(6 * scale);
        for (let d = 0; d < debrisCount; d++) {
            const geom = new THREE.DodecahedronGeometry(Math.random() * 0.4 * scale + 0.2);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x44444e,
                roughness: 0.6,
                metalness: 0.8,
                emissive: colorPalette[0],
                emissiveIntensity: 0.8
            });
            const chunk = new THREE.Mesh(geom, mat);
            chunk.position.copy(position);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 40 * scale,
                (Math.random() - 0.5) * 40 * scale,
                (Math.random() - 0.5) * 40 * scale
            );

            const rotSpeed = new THREE.Vector3(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );

            this.scene.add(chunk);
            this.debrisList.push({
                mesh: chunk,
                velocity: vel,
                rotSpeed: rotSpeed,
                life: 1.2,
                decay: 0.8
            });
        }

        // Camera Shake based on size and distance to camera
        const dist = this.camera.position.distanceTo(position);
        const shake = Math.min(2.5, (scale * 28) / Math.max(10, dist));
        this.addScreenShake(shake);
    }

    createShockwave(position, maxRadius = 15, color = 0x00e5ff) {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
            map: this.textures.ring,
            color: color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.lookAt(this.camera.position);

        this.scene.add(mesh);
        this.shockwaves.push({
            mesh: mesh,
            radius: 1,
            maxRadius: maxRadius,
            speed: maxRadius * 3.5,
            opacity: 0.95
        });
    }

    // ==========================================
    // ENGINE & MISSILE TRAILS
    // ==========================================

    createEngineTrail(position, color = 0x00aaff, size = 1.2, isBoost = false) {
        const material = new THREE.SpriteMaterial({
            map: this.textures.glow,
            color: color,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: isBoost ? 0.95 : 0.75
        });

        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        const pSize = size * (isBoost ? 1.8 : 1.0);
        sprite.scale.set(pSize, pSize, 1);

        this.scene.add(sprite);
        this.particles.push({
            mesh: sprite,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                Math.random() * 6 + 10 // push backwards
            ),
            drag: 0.96,
            scaleSpeed: 0.92,
            life: 1.0,
            decay: isBoost ? 4.5 : 3.5
        });
    }

    createMissileSmoke(position) {
        const material = new THREE.SpriteMaterial({
            map: this.textures.smoke,
            color: 0xcccccc,
            transparent: true,
            opacity: 0.6
        });

        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        const s = Math.random() * 0.8 + 0.6;
        sprite.scale.set(s, s, 1);

        this.scene.add(sprite);
        this.particles.push({
            mesh: sprite,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.0,
                (Math.random() - 0.5) * 1.0,
                (Math.random() - 0.5) * 1.0
            ),
            drag: 0.95,
            scaleSpeed: 1.08, // Expands as it dissipates
            life: 1.0,
            decay: 2.2
        });
    }

    // ==========================================
    // FLOATING 3D COMBAT TEXT
    // ==========================================

    createFloatingText(position, text, color = '#00f0ff') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.font = 'bold 36px Orbitron, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillText(text, 128, 45);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(position);
        sprite.position.y += 1.5;
        sprite.scale.set(4, 1, 1);

        this.scene.add(sprite);
        this.floatingTexts.push({
            mesh: sprite,
            life: 1.0,
            decay: 1.2
        });
    }

    // ==========================================
    // SCREEN SHAKE SYSTEM
    // ==========================================

    addScreenShake(amount) {
        this.shakeIntensity = Math.min(3.5, this.shakeIntensity + amount);
    }

    update(delta) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta * p.decay;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.addScaledVector(p.velocity, delta);
                p.velocity.multiplyScalar(p.drag);
                p.mesh.material.opacity = Math.max(0, p.life);
                p.mesh.scale.multiplyScalar(p.scaleSpeed);
            }
        }

        // Update debris
        for (let i = this.debrisList.length - 1; i >= 0; i--) {
            const d = this.debrisList[i];
            d.life -= delta * d.decay;

            if (d.life <= 0) {
                this.scene.remove(d.mesh);
                d.mesh.geometry.dispose();
                d.mesh.material.dispose();
                this.debrisList.splice(i, 1);
            } else {
                d.mesh.position.addScaledVector(d.velocity, delta);
                d.mesh.rotation.x += d.rotSpeed.x * delta;
                d.mesh.rotation.y += d.rotSpeed.y * delta;
                d.mesh.rotation.z += d.rotSpeed.z * delta;
                d.mesh.material.opacity = Math.max(0, d.life);
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed * delta;
            sw.mesh.scale.set(sw.radius, sw.radius, 1);
            sw.opacity -= delta * 1.6;

            if (sw.radius >= sw.maxRadius || sw.opacity <= 0) {
                this.scene.remove(sw.mesh);
                sw.mesh.geometry.dispose();
                sw.mesh.material.dispose();
                this.shockwaves.splice(i, 1);
            } else {
                sw.mesh.material.opacity = Math.max(0, sw.opacity);
                sw.mesh.lookAt(this.camera.position);
            }
        }

        // Update floating combat text
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= delta * ft.decay;

            if (ft.life <= 0) {
                this.scene.remove(ft.mesh);
                ft.mesh.material.map.dispose();
                ft.mesh.material.dispose();
                this.floatingTexts.splice(i, 1);
            } else {
                ft.mesh.position.y += delta * 2.5;
                ft.mesh.material.opacity = Math.max(0, ft.life);
            }
        }

        // Update warp streaks
        if (this.warpStreaks && this.warpActive) {
            const pos = this.warpStreaks.geometry.attributes.position.array;
            for (let i = 0; i < pos.length; i += 6) {
                pos[i + 2] += delta * 320;
                pos[i + 5] += delta * 320;
                if (pos[i + 2] > 50) {
                    pos[i + 2] -= 250;
                    pos[i + 5] -= 250;
                }
            }
            this.warpStreaks.geometry.attributes.position.needsUpdate = true;
        }

        // Apply Screen Shake
        if (this.shakeIntensity > 0.005) {
            const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
            const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
            const offsetZ = (Math.random() - 0.5) * this.shakeIntensity * 0.5;

            this.camera.position.x += offsetX;
            this.camera.position.y += offsetY;
            this.camera.position.z += offsetZ;

            this.shakeIntensity *= this.shakeDecay;
        }
    }
}

window.EffectsManager = EffectsManager;
