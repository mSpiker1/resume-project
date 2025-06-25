const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const os = require('os');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();
const upload = multer();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/.netlify/functions/server', router);

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

// Set this endpoint to provide the ip to the frontend client
router.get('/server-ip', (req, res) => {
    res.json({ ip: localIp });
});

router.post('/save-canvas', upload.none(), (req, res) => {
    const base64Data = req.body.image.replace(/^data:image\/png;base64,/, '');
    if (!base64Data) {
        return res.status(400).send('Missing image data');
    }

    const outputPath = path.join(__dirname, 'canvas.png');

    fs.writeFile(outputPath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Failed to save image:', err);
            return res.status(500).send('Failed to save image.');
        }
        res.sendStatus(200);
    });
});

router.get('/latest-canvas', (req, res) => {
    const imagePath = path.join(__dirname, 'canvas.png');
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('No canvas found.');
    }
});

module.exports.handler = serverless(app);