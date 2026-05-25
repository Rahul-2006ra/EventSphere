const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..');
const envPath = path.join(frontendDir, 'js', 'env.js');

const publicEnv = {
  API_BASE_URL: process.env.VERCEL_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '',
  SOCKET_URL: process.env.VERCEL_PUBLIC_SOCKET_URL || process.env.SOCKET_URL || '',
  RAZORPAY_KEY: process.env.VERCEL_PUBLIC_RAZORPAY_KEY || process.env.RAZORPAY_KEY || '',
};

fs.writeFileSync(
  envPath,
  `window.EVENTSPHERE_ENV = ${JSON.stringify(publicEnv, null, 2)};\n`,
);

console.log(`[EventSphere] wrote ${path.relative(process.cwd(), envPath)}`);
