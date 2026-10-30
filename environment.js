/**
 * GALAXY WARRIORS - 3D Space Shooter
 * environment.js: Deep-Space Environment, Starfields, Nebulae, Planets & Asteroids
 */

class EnvironmentManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.stars = [];
        this.starLayers = [];
        this.nebulae = [];
        this.planets = [];
        this.asteroids = [];
        this.meteors = [];
        this.clouds = [];

        this.ambientLight = null;
        this.sunLight = null;
        this.rimLight = null;

        this.currentLevelTheme = 1;

        this.initLighting();
        this.initAtmosphericClouds();
        this.initStarfields();
        this.initNebulae();
        this.initPlanets();
        this.initAsteroidField();
    }

    // ==========================================
    // ATMOSPHERIC CLOUDS & SKY DOGFIGHT ENVIRONMENT
    // ==========================================

    createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        grad.addColorStop(0.4, 'rgba(220, 235, 255, 0.45)');
        grad.addColorStop(0.8, 'rgba(160, 190, 230, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    initAtmosphericClouds() {
        const cloudTex = this.createCloudTexture();
        const count = 25;

        for (let i = 0; i < count; i++) {
            const mat = new THREE.SpriteMaterial({
                map: cloudTex,
                transparent: true,
                opacity: 0.45 + Math.random() * 0.3,
                blending: THREE.NormalBlending
            });
            const sprite = new THREE.Sprite(mat);
            const scale = 50 + Math.random() * 60;
            sprite.scale.set(scale, scale * 0.6, 1);

            sprite.position.set(
                (Math.random() - 0.5) * 160,
                -25 - Math.random() * 20, // Cloud deck below the fighters
                -100 - Math.random() * 200
            );

            this.scene.add(sprite);
            this.clouds.push({
                sprite: sprite,
                speed: 28 + Math.random() * 15
            });
        }
    }

    // ==========================================
    // PROCEDURAL TEXTURE HELPERS FOR PLANETS & ASTEROIDS
    // ==========================================

    createPlanetTexture(type = 'gas_giant') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        if (type === 'gas_giant') {
            // Banded Gas Giant (Jupiter / Saturn style)
            const bands = 24;
            for (let i = 0; i < bands; i++) {
                const y = (i / bands) * 256;
                const h = 256 / bands;
                const hue = (i % 2 === 0) ? 200 + Math.sin(i) * 30 : 260 + Math.cos(i) * 40;
                const sat = 60 + Math.sin(i * 1.5) * 30;
                const light = 30 + (i % 3) * 15;
                ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
                ctx.fillRect(0, y, 512, h + 2);
            }
            // Add subtle storm bands
            for (let j = 0; j < 6; j++) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.beginPath();
                ctx.ellipse(120 + j * 60, 80 + j * 20, 45, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'volcanic') {
            // Dark obsidian crust with glowing magma veins
            ctx.fillStyle = '#140c10';
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle = '#ff3300';
            ctx.lineWidth = 3;
            for (let v = 0; v < 16; v++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * 512, Math.random() * 256);
                for (let k = 0; k < 5; k++) {
                    ctx.lineTo(Math.random() * 512, Math.random() * 256);
                }
                ctx.stroke();
            }
        } else {
            // Earth/Alien Blue-Green
            ctx.fillStyle = '#061633';
            ctx.fillRect(0, 0, 512, 256);
            ctx.fillStyle = '#1e7552';
            for (let c = 0; c < 12; c++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 60 + 20, 0, Math.PI * 2);
                ctx.fill();
            }
            // Cloud wisps
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            for (let cl = 0; cl < 20; cl++) {
                ctx.beginPath();
                ctx.ellipse(Math.random() * 512, Math.random() * 256, 70, 15, Math.random() * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    createRingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');

        for (let x = 0; x < 256; x++) {
            const normalized = x / 256;
            const alpha = Math.sin(normalized * Math.PI) * (0.3 + 0.7 * Math.sin(normalized * 40));
            ctx.fillStyle = `rgba(180, 220, 255, ${Math.max(0, alpha)})`;
            ctx.fillRect(x, 0, 1, 1);
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    createNebulaTexture(baseColor = '#8833ff') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(0.4, 'rgba(0, 180, 255, 0.35)');
        grad.addColorStop(0.8, 'rgba(120, 20, 220, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    // ==========================================
    // LIGHTING SYSTEM
    // ==========================================

    initLighting() {
        this.ambientLight = new THREE.AmbientLight(0x182038, 1.2);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xddeeff, 2.0);
        this.sunLight.position.set(40, 60, 40);
        this.scene.add(this.sunLight);

        this.rimLight = new THREE.DirectionalLight(0x0099ff, 1.5);
        this.rimLight.position.set(-50, -20, -50);
        this.scene.add(this.rimLight);
    }

    setTheme(level) {
        this.currentLevelTheme = level;
        let ambientHex = 0x182038;
        let rimHex = 0x0099ff;

        switch (level) {
            case 1: // Asteroid Attack - Deep Blue
                ambientHex = 0x142036;
                rimHex = 0x00c8ff;
                break;
            case 2: // Alien Fighter Assault - Toxic Emerald Green
                ambientHex = 0x0f2818;
                rimHex = 0x00ff88;
                break;
            case 3: // Nebula Warzone - Vibrant Magenta / Purple
                ambientHex = 0x241232;
                rimHex = 0xff00cc;
                break;
            case 4: // Galactic Fleet Battle - Crimson Void
                ambientHex = 0x2c0f14;
                rimHex = 0xff3300;
                break;
            case 5: // Dark Galaxy Destroyer - Cosmic Abyssal Violet
                ambientHex = 0x160822;
                rimHex = 0xaa00ff;
                break;
        }

        if (this.ambientLight) {
            gsap.to(this.ambientLight.color, {
                r: ((ambientHex >> 16) & 255) / 255,
                g: ((ambientHex >> 8) & 255) / 255,
                b: (ambientHex & 255) / 255,
                duration: 2.0
            });
        }
        if (this.rimLight) {
            gsap.to(this.rimLight.color, {
                r: ((rimHex >> 16) & 255) / 255,
                g: ((rimHex >> 8) & 255) / 255,
                b: (rimHex & 255) / 255,
                duration: 2.0
            });
        }
    }

    // ==========================================
    // STARFIELD SYSTEM (Layered Depth & Colors)
    // ==========================================

    initStarfields() {
        // Layer 1: Distant stars (Slowest, 3500 stars)
        this.createStarLayer(3500, 350, 450, 0.8, 12);
        // Layer 2: Mid-ground stars (2000 stars)
        this.createStarLayer(2000, 200, 320, 1.2, 28);
        // Layer 3: Foreground space dust / fast stars (800 stars)
        this.createStarLayer(800, 80, 180, 1.6, 60);
    }

    createStarLayer(count, minRadius, maxRadius, starSize, speed) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const palette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0x99ddff),
            new THREE.Color(0x66aaff),
            new THREE.Color(0xffddaa),
            new THREE.Color(0xff99bb)
        ];

        for (let i = 0; i < count; i++) {
            const r = minRadius + Math.random() * (maxRadius - minRadius);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = (Math.random() - 0.5) * 500;

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: starSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const starField = new THREE.Points(geometry, material);
        this.scene.add(starField);

        this.starLayers.push({
            mesh: starField,
            speed: speed
        });
    }

    // ==========================================
    // NEBULA CLOUDS & GALAXIES
    // ==========================================

    initNebulae() {
        const nebulaColors = ['#9922ff', '#00ddff', '#ff00aa', '#00ffaa'];
        for (let i = 0; i < 8; i++) {
            const tex = this.createNebulaTexture(nebulaColors[i % nebulaColors.length]);
            const mat = new THREE.SpriteMaterial({
                map: tex,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.35 + Math.random() * 0.25
            });

            const sprite = new THREE.Sprite(mat);
            const scale = 140 + Math.random() * 120;
            sprite.scale.set(scale, scale, 1);

            sprite.position.set(
                (Math.random() - 0.5) * 450,
                (Math.random() - 0.5) * 280,
                -250 - Math.random() * 200
            );

            this.scene.add(sprite);
            this.nebulae.push({
                sprite: sprite,
                rotSpeed: (Math.random() - 0.5) * 0.05
            });
        }
    }

    // ==========================================
    // ROTATING PLANETS & RINGS
    // ==========================================

    initPlanets() {
        // Planet 1: Ringed Gas Giant in background
        const gasGiantTex = this.createPlanetTexture('gas_giant');
        const gasGeom = new THREE.SphereGeometry(32, 48, 48);
        const gasMat = new THREE.MeshStandardMaterial({
            map: gasGiantTex,
            roughness: 0.85,
            metalness: 0.1
        });
        const gasGiant = new THREE.Mesh(gasGeom, gasMat);
        gasGiant.position.set(-140, 70, -280);
        this.scene.add(gasGiant);

        // Ring for Gas Giant
        const ringGeom = new THREE.RingGeometry(38, 62, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            map: this.createRingTexture(),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI * 0.42;
        ring.rotation.y = Math.PI * 0.15;
        gasGiant.add(ring);

        this.planets.push({
            mesh: gasGiant,
            rotSpeed: 0.04
        });

        // Planet 2: Distant rocky volcanic world
        const lavaTex = this.createPlanetTexture('volcanic');
        const lavaGeom = new THREE.SphereGeometry(22, 32, 32);
        const lavaMat = new THREE.MeshStandardMaterial({
            map: lavaTex,
            roughness: 0.9,
            emissive: 0xaa2200,
            emissiveIntensity: 0.35
        });
        const lavaPlanet = new THREE.Mesh(lavaGeom, lavaMat);
        lavaPlanet.position.set(160, -60, -320);
        this.scene.add(lavaPlanet);

        this.planets.push({
            mesh: lavaPlanet,
            rotSpeed: -0.025
        });
    }

    // ==========================================
    // ASTEROID FIELD (3D Procedural Rocks)
    // ==========================================

    initAsteroidField() {
        const count = 35;
        for (let i = 0; i < count; i++) {
            this.spawnAsteroid(true);
        }
    }

    spawnAsteroid(randomZ = false) {
        // Procedurally deformed polyhedral asteroid
        const radius = Math.random() * 2.5 + 1.2;
        const geom = new THREE.DodecahedronGeometry(radius, 1);

        // Deform vertices for realistic rugged rock surface
        const posAttr = geom.attributes.position;
        for (let j = 0; j < posAttr.count; j++) {
            const v = new THREE.Vector3().fromBufferAttribute(posAttr, j);
            const noise = 1 + (Math.random() - 0.5) * 0.4;
            v.multiplyScalar(noise);
            posAttr.setXYZ(j, v.x, v.y, v.z);
        }
        geom.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            color: 0x666b7a,
            roughness: 0.9,
            metalness: 0.15,
            flatShading: true
        });

        const mesh = new THREE.Mesh(geom, mat);
        const zPos = randomZ ? (Math.random() * -300 + 20) : -300;

        mesh.position.set(
            (Math.random() - 0.5) * 110,
            (Math.random() - 0.5) * 70,
            zPos
        );

        this.scene.add(mesh);
        this.asteroids.push({
            mesh: mesh,
            radius: radius,
            hp: Math.ceil(radius * 15),
            maxHp: Math.ceil(radius * 15),
            speed: Math.random() * 14 + 18,
            rotSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            )
        });
    }

    // ==========================================
    // METEOR SHOWERS
    // ==========================================

    spawnMeteor() {
        const geom = new THREE.SphereGeometry(0.8, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffaa00
        });
        const mesh = new THREE.Mesh(geom, mat);

        const startX = (Math.random() - 0.5) * 160;
        const startY = 80;
        const startZ = -100 - Math.random() * 150;

        mesh.position.set(startX, startY, startZ);
        this.scene.add(mesh);

        this.meteors.push({
            mesh: mesh,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 40 - 20,
                -75,
                Math.random() * 20 + 20
            ),
            life: 2.5
        });
    }

    // ==========================================
    // UPDATE LOOP
    // ==========================================

    update(delta, playerSpeedRatio = 1.0, isBoosting = false) {
        const speedMult = isBoosting ? 2.8 : playerSpeedRatio;

        // 0. Update atmospheric clouds streaming past in the air
        for (let i = 0; i < this.clouds.length; i++) {
            const cl = this.clouds[i];
            cl.sprite.position.z += (cl.speed * speedMult) * delta;
            if (cl.sprite.position.z > 35) {
                cl.sprite.position.z = -300;
                cl.sprite.position.x = (Math.random() - 0.5) * 160;
                cl.sprite.position.y = -25 - Math.random() * 20;
            }
        }

        // 1. Move star layers past the player
        for (let i = 0; i < this.starLayers.length; i++) {
            const layer = this.starLayers[i];
            const pos = layer.mesh.geometry.attributes.position.array;
            const step = layer.speed * speedMult * delta;

            for (let p = 2; p < pos.length; p += 3) {
                pos[p] += step;
                if (pos[p] > 50) {
                    pos[p] -= 500;
                }
            }
            layer.mesh.geometry.attributes.position.needsUpdate = true;
        }

        // 2. Rotate planets & nebulae
        for (let i = 0; i < this.planets.length; i++) {
            this.planets[i].mesh.rotation.y += this.planets[i].rotSpeed * delta;
        }
        for (let i = 0; i < this.nebulae.length; i++) {
            this.nebulae[i].sprite.material.rotation += this.nebulae[i].rotSpeed * delta;
        }

        // 3. Move and tumble asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const ast = this.asteroids[i];
            ast.mesh.position.z += (ast.speed + (isBoosting ? 30 : 0)) * delta;
            ast.mesh.rotation.x += ast.rotSpeed.x * delta;
            ast.mesh.rotation.y += ast.rotSpeed.y * delta;
            ast.mesh.rotation.z += ast.rotSpeed.z * delta;

            // Recycle asteroid if past camera
            if (ast.mesh.position.z > 35) {
                ast.mesh.position.z = -280;
                ast.mesh.position.x = (Math.random() - 0.5) * 110;
                ast.mesh.position.y = (Math.random() - 0.5) * 70;
                ast.hp = ast.maxHp;
            }
        }

        // 4. Update meteors
        if (Math.random() < 0.02) {
            this.spawnMeteor();
        }

        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.life -= delta;
            m.mesh.position.addScaledVector(m.velocity, delta);

            if (m.life <= 0 || m.mesh.position.y < -80) {
                this.scene.remove(m.mesh);
                m.mesh.geometry.dispose();
                m.mesh.material.dispose();
                this.meteors.splice(i, 1);
            }
        }
    }
}

window.EnvironmentManager = EnvironmentManager;
