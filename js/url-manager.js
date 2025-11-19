export const URLManager = {
    getRoomIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room');
    },

    generateRoomURL(roomId) {
        const baseURL = window.location.origin + window.location.pathname;
        return `${baseURL}?room=${roomId}`;
    },

    hasRoomId() {
        return this.getRoomIdFromURL() !== null;
    }
};
