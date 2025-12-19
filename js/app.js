import { AppState } from './state.js';
import { Utils } from './utils.js';
import { HostConnection } from './host-connection.js';
import { ClientConnection } from './client-connection.js';
import { SensorManager } from './sensor-manager.js';
import { URLManager } from './url-manager.js';
import { ModelLoader } from './model-loader.js';
import { Scene3D } from './scene-3d.js';
import { SpaceScene } from './space-scene.js';
import { HeadAsteroidsScene } from './head-asteroids-scene.js';
import { HeadTracker } from './head-tracker.js';

const app = {
    init() {
        const roomId = URLManager.getRoomIdFromURL();

        if (roomId) {
            this.autoConnect(roomId);
        } else {
            this.showInitialChoice();
        }
    },

    showInitialChoice() {
        document.getElementById('initial-choice').style.display = 'block';
        document.getElementById('host-view').style.display = 'none';
        document.getElementById('join-room').style.display = 'none';
        document.getElementById('mobile-connecting').style.display = 'none';
    },

    createRoom() {
        Utils.log('Criando sala');
        document.getElementById('initial-choice').style.display = 'none';
        HostConnection.start();
    },

    showJoinRoom() {
        Utils.log('Mostrando tela de entrada');
        document.getElementById('initial-choice').style.display = 'none';
        document.getElementById('join-room').style.display = 'block';
    },

    joinRoom() {
        const roomId = document.getElementById('room-id-input').value.trim().toUpperCase();

        if (!roomId) {
            alert('Digite o código da sala!');
            return;
        }

        this.autoConnect(roomId);
    },

    autoConnect(roomId) {
        Utils.log(`Auto-conectando à sala ${roomId}`);
        document.getElementById('initial-choice').style.display = 'none';
        document.getElementById('join-room').style.display = 'none';
        document.getElementById('mobile-connecting').style.display = 'block';

        ClientConnection.start(roomId);
    },

    requestSensorPermission() {
        SensorManager.requestPermission();
    },

    calibrateSensors() {
        SensorManager.calibrate();
    },

    recalibrate() {
        SensorManager.recalibrate();
    },

    changeMappingMode() {
        AppState.currentMapping = document.getElementById('mapping-mode').value;
        Utils.log(`Modo de mapeamento alterado para: ${AppState.currentMapping}`);
    },

    uploadModel() {
        const input = document.getElementById('model-upload');
        input.click();

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            ModelLoader.loadFromFile(
                file,
                (model) => {
                    Scene3D.replaceModel(model);
                    Utils.log('Modelo substituído com sucesso');
                },
                (error) => {
                    alert('Erro ao carregar modelo: ' + error);
                }
            );
        };
    },

    resetModel() {
        const defaultModel = ModelLoader.createDefaultModel();
        Scene3D.replaceModel(defaultModel);
        Utils.log('Modelo restaurado para padrão');
    },

    startSpaceExperience() {
        Utils.log('Iniciando experiência espacial');
        SpaceScene.start();
    },

    exitSpaceExperience() {
        Utils.log('Saindo da experiência espacial');
        SpaceScene.stop();
    },

    startHeadAsteroidsExperience() {
        Utils.log('Iniciando head-tracking asteroids');
        HeadAsteroidsScene.start();
    },

    exitHeadAsteroidsExperience() {
        Utils.log('Saindo do head-tracking asteroids');
        HeadAsteroidsScene.stop();
    },

    requestHeadCameraPermission() {
        Utils.log('Solicitando permissão de câmera para head-tracking');
        const statusEl = document.getElementById('status-bar');
        HeadTracker.primeCamera()
            .then(() => {
                if (statusEl) statusEl.innerText = 'Status: Câmera pronta para head-tracking.';
            })
            .catch(err => {
                Utils.log('Permissão de câmera negada ou erro', err);
                alert('Não foi possível acessar a câmera. Verifique permissões.');
                if (statusEl) statusEl.innerText = 'Status: Câmera não autorizada.';
            });
    }
};

window.app = app;
app.init();
