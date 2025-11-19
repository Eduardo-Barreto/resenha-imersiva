import { AppState } from './state.js';
import { OrientationMapper } from './orientation-mapper.js';

export const Scene3D = {
    init() {
        this.createScene();
        this.createLights();
        this.createCamera();
        this.createRenderer();
        this.createPhoneModel();
        this.animate();
        this.setupResizeHandler();
    },

    createScene() {
        AppState.scene = new THREE.Scene();
        AppState.scene.background = new THREE.Color(0x202020);

        const gridHelper = new THREE.GridHelper(10, 10);
        AppState.scene.add(gridHelper);
    },

    createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        AppState.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        AppState.scene.add(dirLight);
    },

    createCamera() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        AppState.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

        AppState.camera.position.y = 2;
        AppState.camera.rotation.z = Math.PI / 2;
        AppState.camera.position.x = Math.PI;
        AppState.camera.lookAt(0, 0, 0);
    },

    createRenderer() {
        AppState.renderer = new THREE.WebGLRenderer({ antialias: true });
        AppState.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(AppState.renderer.domElement);
    },

    createPhoneModel() {
        const geometry = new THREE.BoxGeometry(1.5, 0.3, 3);
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x2196F3 }),
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x111111 }),
        ];

        AppState.cube = new THREE.Mesh(geometry, materials);
        AppState.scene.add(AppState.cube);
    },

    animate() {
        requestAnimationFrame(() => Scene3D.animate());
        AppState.renderer.render(AppState.scene, AppState.camera);
    },

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            AppState.camera.aspect = window.innerWidth / window.innerHeight;
            AppState.camera.updateProjectionMatrix();
            AppState.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    },

    updateRotation(alpha, beta, gamma) {
        const rotation = OrientationMapper.map(alpha, beta, gamma);
        AppState.cube.rotation.order = rotation.order;
        AppState.cube.rotation.set(rotation.x, rotation.y, rotation.z);
    }
};
