const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;
const cors = require('cors');
const multer = require('multer');
const upload = multer();

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

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
    console.log(`Accessible on local network at http://192.168.56.1:{PORT}`); // Make this modular as well
});