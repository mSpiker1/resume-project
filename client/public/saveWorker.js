// This web worker is meant to streamline that canvas saving process to avoid
// hitches in the web app's CPU usage when saving, which can hinder a user's
// ability to draw on the canvas properly

self.onmessage = async function (e) {
    const blob = e.data.blob;
    if (!blob) return;

    const formData = new FormData();
    formData.append('image', blob, 'canvas.png');

    try {
        const response = await fetch('http://192.168.1.188:3001/save-canvas', {
            method: 'POST',
            body: formData,
        });
        self.postMessage({ success: response.ok });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};