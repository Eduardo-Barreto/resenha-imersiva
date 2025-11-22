import { AppState } from './state.js';
import { OrientationMapper } from './orientation-mapper.js';
import { ModelLoader } from './model-loader.js';

export const Scene3D = {
    init() {
        this.createScene();
        this.createLights();
        this.createCamera();
        this.createRenderer();
        ModelLoader.init();
        this.createPhoneModel();
        this.animate();
        this.setupResizeHandler();
    },

    createScene() {
        AppState.scene = new THREE.Scene();
        AppState.scene.background = new THREE.Color(0x2a2a2a);

        const gridHelper = new THREE.GridHelper(10, 10, 0x555555, 0x333333);
        AppState.scene.add(gridHelper);
    },

    createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
        AppState.scene.add(ambientLight);

        const frontLight = new THREE.DirectionalLight(0xffffff, 2.5);
        frontLight.position.set(0, 5, 5);
        AppState.scene.add(frontLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 2.5);
        backLight.position.set(0, 5, -5);
        AppState.scene.add(backLight);

        const leftLight = new THREE.DirectionalLight(0xffffff, 2.5);
        leftLight.position.set(-5, 5, 0);
        AppState.scene.add(leftLight);

        const rightLight = new THREE.DirectionalLight(0xffffff, 2.5);
        rightLight.position.set(5, 5, 0);
        AppState.scene.add(rightLight);
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
        AppState.cube = ModelLoader.createDefaultModel();
        AppState.scene.add(AppState.cube);
    },

    replaceModel(newModel) {
        if (AppState.cube) {
            AppState.scene.remove(AppState.cube);
            if (AppState.cube.geometry) AppState.cube.geometry.dispose();
            if (AppState.cube.material) {
                if (Array.isArray(AppState.cube.material)) {
                    AppState.cube.material.forEach(m => m.dispose());
                } else {
                    AppState.cube.material.dispose();
                }
            }
        }

        AppState.cube = newModel;
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
