import { AppState } from './state.js';

export const Utils = {
    generateShortId() {
        return Math.random().toString(36).substr(2, 5).toUpperCase();
    },

    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = AppState.isHost ? '[PC]' : '[CELULAR]';
        console.log(`${timestamp} ${prefix} ${message}`, data || '');

        if (AppState.isHost && data) {
            console.log('Dados recebidos:', JSON.stringify(data, null, 2));
        }
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => alert('ID copiado!'))
            .catch(err => console.error('Erro ao copiar:', err));
    }
};
