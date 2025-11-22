import { AppState } from './state.js';
import { Utils } from './utils.js';

export const ModelLoader = {
    loader: null,

    init() {
        this.loader = new THREE.GLTFLoader();
    },

    loadFromFile(file, onSuccess, onError) {
        if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
            onError('Arquivo deve ser .glb ou .gltf');
            return;
        }

        Utils.log('Carregando modelo:', file.name);

        const url = URL.createObjectURL(file);

        this.loader.load(
            url,
            (gltf) => {
                Utils.log('Modelo carregado com sucesso');
                this.processModel(gltf.scene);
                onSuccess(gltf.scene);
                URL.revokeObjectURL(url);
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                Utils.log(`Carregando: ${percent.toFixed(0)}%`);
            },
            (error) => {
                Utils.log('Erro ao carregar modelo', error);
                onError(error);
                URL.revokeObjectURL(url);
            }
        );
    },

    processModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.setScalar(scale);

        Utils.log('Modelo processado - escala:', scale);
    },

    createDefaultModel() {
        const geometry = new THREE.BoxGeometry(1.5, 3, 0.3);
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x2196F3 }),
            new THREE.MeshStandardMaterial({ color: 0x333333 }),
            new THREE.MeshStandardMaterial({ color: 0x111111 }),
        ];

        return new THREE.Mesh(geometry, materials);
    }
};
