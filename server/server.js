const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const os = require('os');

// Helper function to get the local ipv4 address (for dev environment)
const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (
                iface.family === 'IPv4'
                && !iface.internal
                && iface.address.startsWith('192.168.1.')
            ) {
                console.log(iface.address);
                return iface.address;
            }
        }
    }
    // default fallback
    console.log("IPv4 not located, defaulting to localhost.");
    return 'localhost'; // Manually change this line if your server is not setting up properly
};

// Run the function to get the ipv4
const localIp = getLocalIp();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Set this endpoint to provide the ip to the frontend client
app.get('/server-ip', (req, res) => {
    res.json({ ip: localIp });
});

app.post('/save-canvas', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const outputPath = path.join(__dirname, 'public/canvas.png');
    fs.writeFile(outputPath, req.file.buffer, (err) => {
        if (err) {
            console.error('Failed to save image:', err);
            return res.status(500).send('Failed to save image.');
        }
        res.sendStatus(200);
    });
});

app.get('/latest-canvas', (req, res) => {
    const imagePath = path.join(__dirname, 'public/canvas.png');
    res.sendFile(imagePath);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Accessible on local network at http://${localIp}:${PORT}`);
});