const fs = require('fs');
const path = require('path');

exports.handler = async function () {
  try {
    const filePath = path.join(__dirname, '../../client/public/canvas.png');
    const image = fs.readFileSync(filePath);
    const base64 = image.toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: base64,
      isBase64Encoded: true
    };
  } catch (error) {
    return { statusCode: 404, body: 'Image not found' };
  }
};
