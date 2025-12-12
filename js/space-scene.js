import { AppState } from './state.js';

// Standalone scene that keeps the spaceship in front of the camera, moves
// forward indefinitely, and spawns asteroids the player must avoid. Orientation
// data from the phone is smoothed and clamped to avoid extreme or jittery
// steering.
export const SpaceScene = {
    isActive: false,
    scene: null,
    camera: null,
    renderer: null,
    ship: null,
    container: null,
    clock: new THREE.Clock(),
    targetPitch: 0,
    targetYaw: 0,
    currentPitch: 0,
    currentYaw: 0,
    velocityDir: new THREE.Vector3(0, 0, -1),
    cameraPosition: new THREE.Vector3(0, 1.2, 6),
    shipDistance: 4.5,
    maxPitchDeg: 35,
    maxYawDeg: 55,
    lerpFactor: 0.08,
    turnResponsiveness: 0.12,
    speedUnitsPerSec: 6,
    resizeHandler: null,
    loader: new THREE.GLTFLoader(),
    // Asteroid settings
    asteroidTemplate: null,
    asteroidRadius: 1,
    asteroids: [],
    spawnTimer: 0,
    nextSpawnIn: 1.5,
    minSpawnRadius: 25,
    maxSpawnRadius: 45,
    maxAsteroids: 20,
    cleanupDistance: 100,
    cleanupAgeSeconds: 15,
    minAsteroidSpeed: 4,
    maxAsteroidSpeed: 13,
    crashCooldown: false,

    start() {
        if (this.isActive) return;
        this.ensureSetup();
        this.isActive = true;
        this.crashCooldown = false;
        this.resetFlightState();
        this.clock.start();
        document.body.classList.add('space-active');
        this.container.style.display = 'block';
        if (AppState.renderer?.domElement) {
            AppState.renderer.domElement.style.display = 'none';
        }
        this.animate();
    },

    stop() {
        this.isActive = false;
        document.body.classList.remove('space-active');
        if (this.container) this.container.style.display = 'none';
        if (AppState.renderer?.domElement) {
            AppState.renderer.domElement.style.display = 'block';
        }
    },

    ensureSetup() {
        if (this.scene) return;

        this.container = document.getElementById('space-experience');
        this.createRenderer();
        this.createScene();
        this.createCamera();
        this.createLights();
        this.loadSkybox();
        this.loadSpaceship();
        this.loadAsteroidModel();
        this.handleResize();
    },

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
    },

    createScene() {
        this.scene = new THREE.Scene();
    },

    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 2000);
        this.camera.position.copy(this.cameraPosition);
    },

    createLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.6);
        this.scene.add(ambient);

        const key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(5, 5, 5);
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0x88aaff, 0.8);
        fill.position.set(-5, 2, -3);
        this.scene.add(fill);
    },

    loadSkybox() {
        const loader = new THREE.TextureLoader();
        loader.load('assets/skybox.jpg', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.encoding = THREE.sRGBEncoding;
            this.scene.background = texture;
        });
    },

    loadSpaceship() {
        this.loader.load(
            'assets/spaceship.glb',
            (gltf) => {
                this.ship = gltf.scene;
                this.ship.scale.setScalar(1.2);
                this.ship.rotation.set(0, Math.PI, 0);
                this.scene.add(this.ship);
            },
            undefined,
            (error) => {
                console.error('Erro ao carregar nave:', error);
                // fallback simple ship
                const geo = new THREE.ConeGeometry(0.5, 1.6, 12);
                const mat = new THREE.MeshStandardMaterial({ color: 0x66ccff });
                this.ship = new THREE.Mesh(geo, mat);
                this.scene.add(this.ship);
            }
        );
    },

    loadAsteroidModel() {
        this.loader.load(
            'assets/asteroid.glb',
            (gltf) => {
                this.asteroidTemplate = gltf.scene;
                const box = new THREE.Box3().setFromObject(this.asteroidTemplate);
                const size = box.getSize(new THREE.Vector3());
                this.asteroidRadius = Math.max(size.x, size.y, size.z) * 0.5;
            },
            undefined,
            (error) => {
                console.error('Erro ao carregar asteroide:', error);
                const geo = new THREE.IcosahedronGeometry(1, 1);
                const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
                this.asteroidTemplate = new THREE.Mesh(geo, mat);
                this.asteroidRadius = 1;
            }
        );
    },

    cloneAsteroid() {
        if (!this.asteroidTemplate) return null;
        const clone = this.asteroidTemplate.clone(true);
        clone.traverse((node) => {
            if (node.isMesh) {
                node.material = node.material.clone();
            }
        });
        const scale = THREE.MathUtils.randFloat(0.6, 1.4);
        clone.scale.setScalar(scale);
        return { mesh: clone, radius: this.asteroidRadius * scale };
    },

    spawnAsteroid(shipPos) {
        if (!this.asteroidTemplate) return;
        if (this.asteroids.length >= this.maxAsteroids) return;

        const distance = THREE.MathUtils.randFloat(this.minSpawnRadius, this.maxSpawnRadius);
        const dir = new THREE.Vector3(
            Math.random() * 2 - 1,
            THREE.MathUtils.randFloatSpread(0.5),
            Math.random() * 2 - 1
        ).normalize();
        const position = shipPos.clone().add(dir.multiplyScalar(distance));

        const asteroid = this.cloneAsteroid();
        if (!asteroid) return;

        asteroid.mesh.position.copy(position);

        const toShip = shipPos.clone().sub(position).normalize();
        const randomJitter = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize().multiplyScalar(0.35);
        const travelDir = toShip.clone().add(randomJitter).normalize();
        const speed = THREE.MathUtils.randFloat(this.minAsteroidSpeed, this.maxAsteroidSpeed);
        asteroid.velocity = travelDir.multiplyScalar(speed);
        asteroid.spawnedAt = this.clock.elapsedTime;

        this.scene.add(asteroid.mesh);
        this.asteroids.push(asteroid);
    },

    resetFlightState() {
        this.cameraPosition.set(0, 1.2, 6);
        this.velocityDir.set(0, 0, -1);
        this.targetPitch = 0;
        this.targetYaw = 0;
        this.currentPitch = 0;
        this.currentYaw = 0;
        this.spawnTimer = 0;
        this.nextSpawnIn = 1.5;
        this.cleanupAsteroids(true);
        if (this.ship) {
            this.ship.position.set(0, 0, 0);
            this.ship.quaternion.identity();
        }
    },

    onOrientation(data) {
        if (!this.isActive) return;
        const clampedPitchDeg = THREE.MathUtils.clamp(-data.beta, -this.maxPitchDeg, this.maxPitchDeg);
        const clampedYawDeg = THREE.MathUtils.clamp(data.gamma, -this.maxYawDeg, this.maxYawDeg);

        this.targetPitch = THREE.MathUtils.degToRad(clampedPitchDeg);
        this.targetYaw = THREE.MathUtils.degToRad(clampedYawDeg);
    },

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, this.targetPitch, this.lerpFactor);
        this.currentYaw = THREE.MathUtils.lerp(this.currentYaw, this.targetYaw, this.lerpFactor);

        const rotation = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(this.currentPitch, this.currentYaw, 0, 'YXZ')
        );

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(rotation).normalize();
        this.velocityDir.lerp(forward, this.turnResponsiveness);

        const moveStep = this.velocityDir.clone().multiplyScalar(this.speedUnitsPerSec * delta);
        this.cameraPosition.add(moveStep);

        const shipPos = this.cameraPosition.clone()
            .add(this.velocityDir.clone().multiplyScalar(this.shipDistance))
            .add(new THREE.Vector3(0, -0.6, 0));

        this.camera.position.copy(this.cameraPosition);
        this.camera.lookAt(shipPos);

        if (this.ship) {
            this.ship.position.copy(shipPos);
            const shipTargetQuat = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                this.velocityDir.clone().multiplyScalar(-1)
            );
            this.ship.quaternion.slerp(shipTargetQuat, 0.15);
        }

        this.handleAsteroids(delta, shipPos);
        this.renderer.render(this.scene, this.camera);
    },

    handleAsteroids(delta, shipPos) {
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.nextSpawnIn) {
            this.spawnAsteroid(shipPos);
            this.spawnTimer = 0;
            this.nextSpawnIn = THREE.MathUtils.randFloat(1.2, 2.6);
        }

        const now = this.clock.elapsedTime;
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.mesh.position.add(asteroid.velocity.clone().multiplyScalar(delta));

            const distanceToShip = asteroid.mesh.position.distanceTo(shipPos);
            if (distanceToShip < asteroid.radius + 1.2) {
                this.handleCrash();
                return;
            }

            const distFromCam = asteroid.mesh.position.distanceTo(this.cameraPosition);
            if (distFromCam > this.cleanupDistance || now - asteroid.spawnedAt > this.cleanupAgeSeconds) {
                this.scene.remove(asteroid.mesh);
                this.asteroids.splice(i, 1);
            }
        }
    },

    cleanupAsteroids(removeAll = false) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            this.scene.remove(this.asteroids[i].mesh);
        }
        if (removeAll) this.asteroids = [];
    },

    handleCrash() {
        if (this.crashCooldown) return;
        this.crashCooldown = true;
        const statusEl = document.getElementById('status-bar');
        if (statusEl) statusEl.innerText = 'Status: Colisão! Reiniciando...';
        setTimeout(() => {
            this.resetFlightState();
            this.crashCooldown = false;
            if (statusEl) statusEl.innerText = 'Status: Nave pronta.';
        }, 600);
    },

    handleResize() {
        this.resizeHandler = () => {
            if (!this.renderer || !this.camera) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', this.resizeHandler);
    }
};

