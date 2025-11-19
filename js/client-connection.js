import { AppState } from './state.js';
import { Utils } from './utils.js';
import { SensorManager } from './sensor-manager.js';

export const ClientConnection = {
    start(remoteId) {
        AppState.isClient = true;
        Utils.log(`Tentando conectar ao PC com ID: ${remoteId}`);

        this.initializePeer(remoteId);
    },

    initializePeer(remoteId) {
        AppState.peer = new Peer();

        AppState.peer.on('open', id => this.onPeerOpen(id, remoteId));
        AppState.peer.on('error', err => this.onError(err));
    },

    onPeerOpen(id, remoteId) {
        Utils.log(`PeerJS do celular aberto com ID: ${id}`);

        const statusEl = document.getElementById('status-bar');
        statusEl.innerText = 'Status: Conectando ao PC...';

        AppState.connection = AppState.peer.connect(remoteId);

        AppState.connection.on('open', () => this.onConnectionOpen());
        AppState.connection.on('error', err => this.onConnectionError(err));
        AppState.connection.on('close', () => this.onConnectionClose());
    },

    onConnectionOpen() {
        Utils.log('Conexão estabelecida com o PC!');

        const statusEl = document.getElementById('status-bar');
        statusEl.innerText = 'Status: Conectado!';

        document.getElementById('ui-layer').style.display = 'none';
        document.getElementById('mobile-controls').style.display = 'flex';

        SensorManager.checkAndStart();
    },

    onConnectionError(err) {
        Utils.log('Erro na conexão', err);
        alert('Erro: ' + err);
    },

    onConnectionClose() {
        Utils.log('Conexão com PC fechada');
        alert('Conexão perdida!');
    },

    onError(err) {
        Utils.log('Erro no PeerJS', err);
        alert('Erro PeerJS: ' + err);
    }
};
