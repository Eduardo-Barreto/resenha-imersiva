import { AppState } from './state.js';
import { Utils } from './utils.js';

export const SensorManager = {
    lastRawOrientation: { alpha: 0, beta: 0, gamma: 0 },

    checkAndStart() {
        Utils.log('Verificando disponibilidade de sensores...');

        const needsPermission = typeof DeviceOrientationEvent !== 'undefined' &&
                              typeof DeviceOrientationEvent.requestPermission === 'function';

        if (needsPermission) {
            Utils.log('iOS detectado - clique no botão para ativar sensores');
        } else {
            Utils.log('Android/dispositivo padrão - iniciando sensores automaticamente');
            this.start();
        }
    },

    requestPermission() {
        Utils.log('Solicitando permissão de sensores...');

        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {

            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    Utils.log(`Resposta de permissão: ${response}`);
                    if (response === 'granted') {
                        this.start();
                    } else {
                        alert('Permissão negada.');
                    }
                })
                .catch(err => {
                    Utils.log('Erro ao solicitar permissão', err);
                    console.error(err);
                });
        } else {
            this.start();
        }
    },

    start() {
        if (AppState.sensorListenerAdded) {
            Utils.log('Listener de sensores já adicionado');
            return;
        }

        Utils.log('Iniciando captura de dados dos sensores...');
        window.addEventListener('deviceorientation', e => this.handleOrientation(e), true);
        AppState.sensorListenerAdded = true;
        Utils.log('Listener de deviceorientation adicionado');

        this.setupSensorTimeout();
    },

    setupSensorTimeout() {
        setTimeout(() => {
            if (!AppState.firstEventReceived) {
                Utils.log('⚠️ AVISO: Nenhum evento de orientação recebido após 3 segundos');
                Utils.log('Possíveis causas: 1) Site não está em HTTPS, 2) Navegador bloqueou, 3) Sensores desativados');
                alert('⚠️ Sensores não estão enviando dados!\n\nVerifique:\n- O site está em HTTPS?\n- Você deu permissão?\n- Os sensores estão ativos?\n\nAbra o console para mais detalhes.');
            }
        }, 3000);
    },

    handleOrientation(event) {
        if (!AppState.firstEventReceived) {
            AppState.firstEventReceived = true;
            Utils.log('✓ Primeiro evento de orientação recebido!', event);
            this.updateMobileStatus();
        }

        if (event.alpha === null && event.beta === null && event.gamma === null) {
            return;
        }

        this.lastRawOrientation = {
            alpha: event.alpha !== null ? event.alpha : 0,
            beta: event.beta !== null ? event.beta : 0,
            gamma: event.gamma !== null ? event.gamma : 0
        };

        if (!AppState.isCalibrated) {
            return;
        }

        const now = Date.now();
        if (now - AppState.lastSendTime < 33) return;

        if (!AppState.connection || !AppState.connection.open) {
            if (AppState.messageCount === 0) {
                Utils.log('⚠️ Tentando enviar dados mas conexão não está aberta');
            }
            return;
        }

        this.sendOrientationData(event);
        AppState.lastSendTime = now;
    },

    calibrate() {
        AppState.calibrationOffset = {
            alpha: this.lastRawOrientation.alpha - 90,
            beta: this.lastRawOrientation.beta,
            gamma: this.lastRawOrientation.gamma
        };
        AppState.isCalibrated = true;
        Utils.log('✓ Calibração realizada!', AppState.calibrationOffset);
        this.updateCalibrationUI();
    },

    updateCalibrationUI() {
        const calibrationSection = document.getElementById('calibration-section');
        const controlsSection = document.getElementById('controls-section');
        const mobileStatus = document.getElementById('mobile-status');

        if (calibrationSection) calibrationSection.style.display = 'none';
        if (controlsSection) controlsSection.style.display = 'block';
        if (mobileStatus) {
            mobileStatus.innerText = '✓ Calibrado! Gire seu celular.';
            mobileStatus.style.color = '#4CAF50';
        }
    },

    sendOrientationData(event) {
        const rawAlpha = event.alpha !== null ? event.alpha : 0;
        const rawBeta = event.beta !== null ? event.beta : 0;
        const rawGamma = event.gamma !== null ? event.gamma : 0;

        const data = {
            type: 'orientation',
            alpha: ((rawAlpha - AppState.calibrationOffset.alpha) + 360) % 360,
            beta: rawBeta - AppState.calibrationOffset.beta,
            gamma: rawGamma - AppState.calibrationOffset.gamma
        };

        AppState.connection.send(data);
        AppState.messageCount++;

        if (AppState.messageCount === 1) {
            Utils.log('✓ Primeira mensagem enviada com sucesso!', data);
        }
        if (AppState.messageCount % 30 === 0) {
            Utils.log(`Enviadas ${AppState.messageCount} mensagens`, data);
        }

        this.updateUI(data);
    },

    updateUI(data) {
        document.getElementById('sensor-debug').innerText =
            `X: ${data.beta.toFixed(0)} | Y: ${data.gamma.toFixed(0)} | Z: ${data.alpha.toFixed(0)}`;

        const screen = document.getElementById('virtual-screen-active');
        if (screen) {
            screen.style.transform = `rotate(${data.gamma}deg)`;
        }
    },

    updateMobileStatus() {
        const statusEl = document.getElementById('mobile-status');
        if (statusEl) {
            statusEl.innerText = '✓ Sensores ativos! Enviando dados...';
            statusEl.style.color = '#4CAF50';
        }
    }
};
