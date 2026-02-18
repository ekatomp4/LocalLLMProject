// get config

import dotenv from 'dotenv';
import { startExpress } from './backend/startExpress.js';
import { startWebSocket } from './backend/startWebSocket.js';

const env = dotenv.config();

if (env.error) {
  throw env.error;
}

const config = env.parsed;

console.log(config);

// start services

startExpress(config.PORT || 3000);
startWebSocket(config.WS_PORT || 3001);
