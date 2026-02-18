import { WebSocketServer } from 'ws';

export function startWebSocket(wsPort) {
  const wss = new WebSocketServer({ port: wsPort });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      console.log('Received:', message.toString());
      ws.send(`Echo: ${message}`);
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  console.log(`WebSocket running on ws://localhost:${wsPort}`);

  return wss;
}
