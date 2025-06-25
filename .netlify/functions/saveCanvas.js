const fs = require('fs');
const path = require('path');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const base64 = JSON.parse(event.body).image;
    const buffer = Buffer.from(base64.replace(/^data:image\/png;base64,/, ''), 'base64');

    const outputPath = path.join(__dirname, '../../client/public/canvas.png');
    fs.writeFileSync(outputPath, buffer);

    return { statusCode: 200, body: 'Image saved successfully' };
  } catch (error) {
    console.error('Save error:', error);
    return { statusCode: 500, body: 'Failed to save image' };
  }
};