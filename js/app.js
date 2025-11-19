import { AppState } from './state.js';
import { Utils } from './utils.js';
import { HostConnection } from './host-connection.js';
import { ClientConnection } from './client-connection.js';
import { SensorManager } from './sensor-manager.js';
import { URLManager } from './url-manager.js';

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

    changeMappingMode() {
        AppState.currentMapping = document.getElementById('mapping-mode').value;
        Utils.log(`Modo de mapeamento alterado para: ${AppState.currentMapping}`);
    }
};

window.app = app;
app.init();
