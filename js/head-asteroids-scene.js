import { AppState } from './state.js';
import { HeadTracker } from './head-tracker.js';

// Static camera scene where asteroids fly toward the viewer; the player's head
// movement (webcam) offsets the camera to dodge them.
export const HeadAsteroidsScene = {
    isActive: false,
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    clock: new THREE.Clock(),
    baseCameraPos: new THREE.Vector3(0, 0, 0),
    cameraOffset: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 },
    asteroidTemplate: null,
    asteroidRadius: 1,
    asteroids: [],
    spawnTimer: 0,
    nextSpawnIn: 1.0,
    spawnDistance: 50,
    minSpawnDistance: 35,
    maxSpawnDistance: 60,
    viewportHalfWidthAtSpawn: 18,
    viewportHalfHeightAtSpawn: 10,
    maxAsteroids: 22,
    minSpeed: 8,
    maxSpeed: 16,
    cleanupDistance: 90,
    collisionRadius: 2.0,
    crashCooldown: false,
    loader: new THREE.GLTFLoader(),

    start() {
        if (this.isActive) return;
        this.ensureSetup();
        this.isActive = true;
        this.resetState();
        this.clock.start();
        document.body.classList.add('space-active');
        this.container.style.display = 'block';
        if (AppState.renderer?.domElement) {
            AppState.renderer.domElement.style.display = 'none';
        }
        HeadTracker.start((pose) => this.onHeadPose(pose));
        this.animate();
    },

    stop() {
        this.isActive = false;
        document.body.classList.remove('space-active');
        if (this.container) this.container.style.display = 'none';
        if (AppState.renderer?.domElement) {
            AppState.renderer.domElement.style.display = 'block';
        }
        HeadTracker.stop();
    },

    ensureSetup() {
        if (this.scene) return;
        this.container = document.getElementById('headspace-experience');
        this.createRenderer();
        this.createScene();
        this.createCamera();
        this.createLights();
        this.loadSkybox();
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
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);
        this.camera.position.copy(this.baseCameraPos);
        this.camera.lookAt(new THREE.Vector3(0, 0, -1));
    },

    createLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.4);
        this.scene.add(ambient);

        const front = new THREE.DirectionalLight(0xffffff, 1.0);
        front.position.set(0, 0, 1);
        this.scene.add(front);
    },

    loadSkybox() {
        const loader = new THREE.TextureLoader();
        loader.load('assets/skybox.jpg', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.encoding = THREE.sRGBEncoding;
            this.scene.background = texture;
        });
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
                console.error('Erro ao carregar asteroide (head mode):', error);
                const geo = new THREE.IcosahedronGeometry(1, 1);
                const mat = new THREE.MeshStandardMaterial({ color: 0x999999 });
                this.asteroidTemplate = new THREE.Mesh(geo, mat);
                this.asteroidRadius = 1;
            }
        );
    },

    cloneAsteroid() {
        if (!this.asteroidTemplate) return null;
        const clone = this.asteroidTemplate.clone(true);
        clone.traverse((node) => {
            if (node.isMesh) node.material = node.material.clone();
        });
        const scale = THREE.MathUtils.randFloat(0.6, 1.4);
        clone.scale.setScalar(scale);
        return { mesh: clone, radius: this.asteroidRadius * scale };
    },

    resetState() {
        this.camera.position.copy(this.baseCameraPos);
        this.camera.rotation.set(0, 0, 0);
        this.cameraOffset = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 };
        this.spawnTimer = 0;
        this.nextSpawnIn = 1.0;
        this.cleanupAsteroids(true);
        this.crashCooldown = false;
    },

    onHeadPose(pose) {
        this.cameraOffset = pose;
    },

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        this.updateCameraFromHead();
        this.handleAsteroids(delta);
        this.renderer.render(this.scene, this.camera);
    },

    updateCameraFromHead() {
        const maxOffset = 2.2;
        const maxDepth = 2.0;
        this.camera.position.set(
            this.baseCameraPos.x + THREE.MathUtils.clamp(this.cameraOffset.tx, -maxOffset, maxOffset),
            this.baseCameraPos.y + THREE.MathUtils.clamp(this.cameraOffset.ty, -maxOffset, maxOffset),
            this.baseCameraPos.z + THREE.MathUtils.clamp(this.cameraOffset.tz, -maxDepth, maxDepth)
        );
        this.camera.rotation.set(
            this.cameraOffset.rx,
            this.cameraOffset.ry,
            this.cameraOffset.rz
        );
    },

    spawnAsteroid() {
        if (!this.asteroidTemplate) return;
        if (this.asteroids.length >= this.maxAsteroids) return;

        const distance = THREE.MathUtils.randFloat(this.minSpawnDistance, this.maxSpawnDistance);
        const x = THREE.MathUtils.randFloatSpread(this.viewportHalfWidthAtSpawn * 2);
        const y = THREE.MathUtils.randFloatSpread(this.viewportHalfHeightAtSpawn * 2);
        const z = -distance;
        const position = new THREE.Vector3(x, y, z);

        const asteroid = this.cloneAsteroid();
        if (!asteroid) return;
        asteroid.mesh.position.copy(position);

        const toCamera = this.camera.position.clone().sub(position).normalize();
        const jitter = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize().multiplyScalar(0.35);
        const dir = toCamera.add(jitter).normalize();
        const speed = THREE.MathUtils.randFloat(this.minSpeed, this.maxSpeed);
        asteroid.velocity = dir.multiplyScalar(speed);
        asteroid.spawnedAt = this.clock.elapsedTime;

        this.scene.add(asteroid.mesh);
        this.asteroids.push(asteroid);
    },

    handleAsteroids(delta) {
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.nextSpawnIn) {
            this.spawnAsteroid();
            this.spawnTimer = 0;
            this.nextSpawnIn = THREE.MathUtils.randFloat(0.6, 1.4);
        }

        const now = this.clock.elapsedTime;
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.mesh.position.add(asteroid.velocity.clone().multiplyScalar(delta));

            const distanceToCamera = asteroid.mesh.position.distanceTo(this.camera.position);
            if (distanceToCamera < asteroid.radius + this.collisionRadius) {
                this.handleCrash();
                return;
            }

            if (distanceToCamera > this.cleanupDistance || now - asteroid.spawnedAt > 12) {
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
            this.resetState();
            this.crashCooldown = false;
            if (statusEl) statusEl.innerText = 'Status: Pronto para desviar';
        }, 700);
    },

    handleResize() {
        window.addEventListener('resize', () => {
            if (!this.renderer || !this.camera) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
};

