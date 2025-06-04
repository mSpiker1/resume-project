// This web worker is meant to streamline that canvas saving process to avoid
// hitches in the web app's CPU usage when saving, which can hinder a user's
// ability to draw on the canvas properly

// Setup to get the ipv4 address
let serverIp = null;
let port = 3001;

self.onmessage = async function (e) {
    const blob = e.data;
    if(!blob) return;

    // if received image blob, save new canvas image
    if (blob) {
        const formData = new FormData();
        formData.append('image', blob, 'canvas.png');

        try {
            const response = await fetch(`http://localhost:3001/save-canvas`, { // This needs to be fixed later for production
                method: 'POST',
                body: formData,
            });
            self.postMessage({ success: response.ok });
        } catch (error) {
            self.postMessage({ success: false, error: error.message });
        }
    }
};