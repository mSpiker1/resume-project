const express = require('express');
const serverless = require('serverless-http');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

console.log("CLOUD_NAME, CLOUD_API_KEY");

const app = express();
const router = express.Router();

app.use(express.json({ limit: '100mb' }));
app.use('/.netlify/functions/server', router);

router.post('/save-canvas', async (req, res) => {
    try {
        const base64Image = req.body.image;
        if (!base64Image || !base64Image.startsWith('data:image')) {
            return res.status(400).send('Invalid image data.');
        }
  
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        public_id: 'canvas',
        overwrite: true,
        invalidate: true
    });
  
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (err) {
        console.error('Cloudinary upload failed:', err);
        res.status(500).send('Failed to upload image.');
    }
});

router.get('/latest-canvas', (req, res) => {
    const timeStamp = Date.now();
    const imageUrl = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/image/upload/canvas.png?t=${timeStamp}`;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({ url: imageUrl });
});

module.exports.handler = serverless(app);