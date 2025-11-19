import { AppState } from './state.js';
import { Utils } from './utils.js';
import { Scene3D } from './scene-3d.js';

export const HostConnection = {
    start() {
        AppState.isHost = true;
        Utils.log('Iniciando como HOST (PC)');

        this.setupUI();
        Scene3D.init();
        this.initializePeer();
    },

    setupUI() {
        document.getElementById('ui-layer').querySelector('h1').style.display = 'none';
        document.querySelectorAll('.btn').forEach(btn => btn.style.display = 'none');
        document.getElementById('id-display').style.display = 'block';
    },

    initializePeer() {
        const myId = Utils.generateShortId();
        AppState.peer = new Peer(myId);

        AppState.peer.on('open', id => this.onPeerOpen(id));
        AppState.peer.on('connection', conn => this.onConnection(conn));
        AppState.peer.on('error', err => this.onError(err));
    },

    onPeerOpen(id) {
        Utils.log(`PeerJS aberto com ID: ${id}`);

        const statusEl = document.getElementById('status-bar');
        const idEl = document.getElementById('my-peer-id');

        idEl.innerText = id;
        statusEl.innerText = `Status: PC Pronto. ID: ${id}`;
        idEl.onclick = () => Utils.copyToClipboard(id);
    },

    onConnection(connection) {
        AppState.connection = connection;
        Utils.log('Celular tentando conectar...');

        const statusEl = document.getElementById('status-bar');
        statusEl.innerText = 'Status: Celular Conectando...';

        connection.on('open', () => this.onConnectionOpen(statusEl));
        connection.on('data', data => this.onDataReceived(data));
        connection.on('error', err => this.onConnectionError(err));
        connection.on('close', () => this.onConnectionClose(statusEl));
    },

    onConnectionOpen(statusEl) {
        Utils.log('Conexão estabelecida com sucesso!');
        statusEl.innerText = 'Status: Celular Conectado!';
        statusEl.style.color = '#4CAF50';
        document.getElementById('ui-layer').classList.add('hidden');
        document.getElementById('debug-panel').style.display = 'block';
    },

    onDataReceived(data) {
        AppState.dataCount++;
        if (AppState.dataCount % 60 === 1) {
            Utils.log('Dados recebidos do celular', data);
        }

        if (data.type === 'orientation') {
            this.updateDebugPanel(data);
            this.updateCubeRotation(data);
        }
    },

    updateDebugPanel(data) {
        document.getElementById('debug-alpha').innerText = data.alpha.toFixed(1);
        document.getElementById('debug-beta').innerText = data.beta.toFixed(1);
        document.getElementById('debug-gamma').innerText = data.gamma.toFixed(1);
    },

    updateCubeRotation(data) {
        const alpha = data.alpha * (Math.PI / 180);
        const beta = data.beta * (Math.PI / 180);
        const gamma = data.gamma * (Math.PI / 180);

        Scene3D.updateRotation(alpha, beta, gamma);
    },

    onConnectionError(err) {
        Utils.log('Erro na conexão', err);
        alert('Erro na conexão: ' + err);
    },

    onConnectionClose(statusEl) {
        Utils.log('Celular desconectado');
        statusEl.innerText = 'Status: Celular Desconectado.';
        statusEl.style.color = 'white';
        document.getElementById('ui-layer').classList.remove('hidden');
    },

    onError(err) {
        Utils.log('Erro no PeerJS', err);
        alert('Erro PeerJS: ' + err);
    }
};
