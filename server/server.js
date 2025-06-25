const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

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

// Set this endpoint to provide the ip to the frontend client
app.get('/server-ip', (req, res) => {
    res.json({ ip: localIp });
});

app.post('/save-canvas', (req, res) => {
    const base64Data = req.body.image?.replace(/^data:image\/png;base64,/, '');
    if (!base64Data) return res.status(400).send('Invalid image data');
  
    fs.writeFile('public/canvas.png', base64Data, 'base64', (err) => {
      if (err) {
        console.error('Write failed:', err);
        return res.status(500).send('Failed to save image');
      }
      res.sendStatus(200);
    });
  });

  app.get('/latest-canvas', (req, res) => {
    const imagePath = path.join(__dirname, 'public/canvas.png');
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).send('Canvas not found');
    }
  });

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });