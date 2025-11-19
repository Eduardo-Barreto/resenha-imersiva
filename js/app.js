import { AppState } from './state.js';
import { Utils } from './utils.js';
import { HostConnection } from './host-connection.js';
import { ClientConnection } from './client-connection.js';
import { SensorManager } from './sensor-manager.js';

const app = {
    startAsHost() {
        HostConnection.start();
    },

    showConnectMenu() {
        Utils.log('Mostrando menu de conexão');
        document.querySelector('h1').innerText = 'Conectar ao PC';
        document.querySelectorAll('#ui-layer > .btn').forEach(btn => btn.style.display = 'none');
        document.getElementById('connect-menu').style.display = 'block';
    },

    connectToHost() {
        const remoteId = document.getElementById('remote-id-input').value.trim().toUpperCase();

        if (!remoteId) {
            alert('Digite o ID!');
            return;
        }

        ClientConnection.start(remoteId);
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
