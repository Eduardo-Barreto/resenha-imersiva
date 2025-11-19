import { AppState } from './state.js';

export const OrientationMapper = {
    modes: {
        'standard': (alpha, beta, gamma) => ({
            x: beta,
            y: alpha,
            z: -gamma,
            order: 'YXZ'
        }),

        'portrait': (alpha, beta, gamma) => ({
            x: -gamma,
            y: alpha,
            z: beta - Math.PI / 2,
            order: 'YXZ'
        }),

        'landscape': (alpha, beta, gamma) => ({
            x: beta,
            y: alpha,
            z: -gamma,
            order: 'YXZ'
        }),

        'direct': (alpha, beta, gamma) => ({
            x: beta,
            y: gamma,
            z: alpha,
            order: 'XYZ'
        }),

        'direct-swapped': (alpha, beta, gamma) => ({
            x: gamma,
            y: beta,
            z: alpha,
            order: 'XYZ'
        }),

        'inverted': (alpha, beta, gamma) => ({
            x: gamma,
            y: alpha,
            z: -beta,
            order: 'YXZ'
        })
    },

    map(alpha, beta, gamma) {
        const mapper = this.modes[AppState.currentMapping];
        return mapper ? mapper(alpha, beta, gamma) : this.modes.standard(alpha, beta, gamma);
    }
};
