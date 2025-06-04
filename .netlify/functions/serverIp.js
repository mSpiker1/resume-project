const os = require('os');

// Get the server ip to access canvas png
exports.handler = async function () {
  const interfaces = os.networkInterfaces();
  let ip = 'localhost';

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal
      ) {
        ip = iface.address;
        break;
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ip })
  };
};
