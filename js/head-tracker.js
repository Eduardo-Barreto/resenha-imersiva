// Lightweight head tracking using MediaPipe FaceMesh.
// Produces a smoothed position/rotation signal to drive the camera.
export const HeadTracker = {
    video: null,
    faceMesh: null,
    isActive: false,
    onPose: null,
    smoothing: 0.35,
    lastPose: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 },
    streamPromise: null,
    stream: null,

    async start(onPose) {
        if (this.isActive) return;
        this.onPose = onPose;
        this.ensureVideo();
        this.ensureFaceMesh();
        await this.startCamera();
        this.isActive = true;
    },

    async primeCamera() {
        if (this.streamPromise) return this.streamPromise;
        if (!navigator.mediaDevices?.getUserMedia) {
            return Promise.reject(new Error('getUserMedia não suportado'));
        }
        this.streamPromise = navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            .then(stream => {
                this.stream = stream;
                return stream;
            })
            .catch(err => {
                this.streamPromise = null;
                throw err;
            });
        return this.streamPromise;
    },

    stop() {
        this.isActive = false;
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(t => t.stop());
            this.video.srcObject = null;
        }
        this.stream = null;
        this.streamPromise = null;
    },

    ensureVideo() {
        if (this.video) return;
        this.video = document.createElement('video');
        this.video.style.position = 'fixed';
        this.video.style.opacity = '0';
        this.video.style.pointerEvents = 'none';
        this.video.playsInline = true;
        document.body.appendChild(this.video);
    },

    ensureFaceMesh() {
        if (this.faceMesh) return;
        this.faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });
        this.faceMesh.onResults((results) => this.handleResults(results));
    },

    async startCamera() {
        const stream = this.stream || await this.primeCamera();
        this.video.srcObject = stream;
        await this.video.play();

        const camera = new Camera(this.video, {
            onFrame: async () => {
                if (!this.faceMesh) return;
                await this.faceMesh.send({ image: this.video });
            },
            width: 640,
            height: 360
        });
        camera.start();
    },

    handleResults(results) {
        if (!this.isActive || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
        const lm = results.multiFaceLandmarks[0];

        // Landmark indices
        const nose = lm[1];
        const leftEye = lm[33];
        const rightEye = lm[263];

        // Normalize offsets relative to center
        const cx = 0.5, cy = 0.5;
        const nx = nose.x - cx;
        const ny = nose.y - cy;

        // Estimate roll from eye line
        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const roll = Math.atan2(dy, dx);

        // Map to translation/rotation
        const tx = this.smooth(nx * -0.9, 'tx');
        const ty = this.smooth(ny * 0.9, 'ty');
        const tz = this.smooth((nose.z || 0) * 2.2, 'tz'); // closer head => negative z
        const ry = this.smooth(nx * -0.8, 'ry'); // yaw
        const rx = this.smooth(ny * -0.8, 'rx'); // pitch
        const rz = this.smooth(roll * 0.8, 'rz'); // roll

        if (this.onPose) {
            this.onPose({ tx, ty, tz, rx, ry, rz });
        }
    },

    smooth(value, key) {
        const prev = this.lastPose[key];
        const smoothed = prev + (value - prev) * this.smoothing;
        this.lastPose[key] = smoothed;
        return smoothed;
    }
};

