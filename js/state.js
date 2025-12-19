export const AppState = {
    peer: null,
    connection: null,
    isHost: false,
    isClient: false,
    currentMapping: 'standard',
    scene: null,
    camera: null,
    renderer: null,
    cube: null,
    sensorListenerAdded: false,
    firstEventReceived: false,
    messageCount: 0,
    dataCount: 0,
    lastSendTime: 0,
    calibrationOffset: { alpha: 0, beta: 0, gamma: 0 },
    isCalibrated: false
};
