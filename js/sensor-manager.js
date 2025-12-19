import { AppState } from './state.js';
import { Utils } from './utils.js';

export const SensorManager = {
    lastRawOrientation: { alpha: 0, beta: 0, gamma: 0 },
    currentStep: 1,

    checkAndStart() {
        Utils.log('Verificando disponibilidade de sensores...');
        const needsPermission = typeof DeviceOrientationEvent !== 'undefined' &&
                              typeof DeviceOrientationEvent.requestPermission === 'function';

        if (needsPermission) {
            Utils.log('iOS detectado - aguardando clique do usuário');
        } else {
            Utils.log('Android/dispositivo padrão - aguardando clique do usuário');
        }
    },

    requestPermission() {
        Utils.log('Solicitando permissão de sensores...');
        const statusEl = document.getElementById('sensor-status');
        const btnEl = document.getElementById('btn-activate-sensors');

        if (statusEl) {
            statusEl.textContent = 'Solicitando permissão...';
            statusEl.className = 'step-status loading';
        }
        if (btnEl) btnEl.disabled = true;

        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {

            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    Utils.log(`Resposta de permissão: ${response}`);
                    if (response === 'granted') {
                        this.start();
                        this.onSensorsAuthorized();
                    } else {
                        this.onSensorsDenied();
                    }
                })
                .catch(err => {
                    Utils.log('Erro ao solicitar permissão', err);
                    this.onSensorsDenied();
                });
        } else {
            this.start();
            this.onSensorsAuthorized();
        }
    },

    onSensorsAuthorized() {
        const statusEl = document.getElementById('sensor-status');
        if (statusEl) {
            statusEl.textContent = 'Sensores ativados!';
            statusEl.className = 'step-status success';
        }

        setTimeout(() => this.goToStep(2), 800);
    },

    onSensorsDenied() {
        const statusEl = document.getElementById('sensor-status');
        const btnEl = document.getElementById('btn-activate-sensors');

        if (statusEl) {
            statusEl.textContent = 'Permissão negada. Tente novamente.';
            statusEl.className = 'step-status error';
        }
        if (btnEl) btnEl.disabled = false;
    },

    goToStep(step) {
        this.currentStep = step;

        document.querySelectorAll('.onboarding-step').forEach(el => {
            el.classList.remove('active');
        });
        const targetStep = document.getElementById(`onboarding-step-${step}`);
        if (targetStep) targetStep.classList.add('active');

        document.querySelectorAll('.progress-step').forEach((el, index) => {
            const dot = el.querySelector('.step-dot');
            const stepNum = index + 1;

            el.classList.remove('active', 'completed');
            dot.classList.remove('active', 'completed');

            if (stepNum < step) {
                el.classList.add('completed');
                dot.classList.add('completed');
            } else if (stepNum === step) {
                el.classList.add('active');
                dot.classList.add('active');
            }
        });

        document.querySelectorAll('.progress-line').forEach((el, index) => {
            el.classList.remove('completed');
            if (index < step - 1) {
                el.classList.add('completed');
            }
        });

        Utils.log(`Onboarding: avançou para step ${step}`);
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
            this.updateCalibrationIndicator(true);
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

    updateCalibrationIndicator(ready) {
        const indicator = document.getElementById('calibration-indicator');
        if (!indicator) return;

        if (ready) {
            indicator.textContent = 'Pronto para calibrar';
            indicator.classList.add('ready');
        } else {
            indicator.textContent = 'Aguardando sensores...';
            indicator.classList.remove('ready');
        }
    },

    calibrate() {
        AppState.calibrationOffset = {
            alpha: this.lastRawOrientation.alpha - 90,
            beta: this.lastRawOrientation.beta,
            gamma: this.lastRawOrientation.gamma
        };
        AppState.isCalibrated = true;
        Utils.log('✓ Calibração realizada!', AppState.calibrationOffset);

        this.goToStep(3);
    },

    recalibrate() {
        AppState.isCalibrated = false;
        this.goToStep(2);
        this.updateCalibrationIndicator(AppState.firstEventReceived);
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
        const debugEl = document.getElementById('sensor-debug');
        if (debugEl) {
            debugEl.innerText = `X: ${data.beta.toFixed(0)} | Y: ${data.gamma.toFixed(0)} | Z: ${data.alpha.toFixed(0)}`;
        }
    }
};
