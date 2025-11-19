export const QRGenerator = {
    generate(containerId, url) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        new QRCode(container, {
            text: url,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }
};
