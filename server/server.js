const express = require('express');
const cors = require('cors');
const os = require('os');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.post('/save-canvas', async (req, res) => {
    try {
        const base64Image = req.body.image;
        if (!base64Image || !base64Image.startsWith('data:image')) {
            return res.status(400).send('Invalid image data.');
        }
  
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        public_id: 'canvas',
        overwrite: true,
    });
  
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (err) {
        console.error('Cloudinary upload failed:', err);
        res.status(500).send('Failed to upload image.');
    }
});

app.get('/latest-canvas', (req, res) => {
    const cloudName = process.env.CLOUD_NAME;
    const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/canvas.png`; // folder + public_id
    res.redirect(imageUrl);
});

app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});