import express from 'express';

const ENDPOINTS = {
  "ping": (req, res) => res.send("pong"),
};

export function startExpress(port) {
  const app = express();

  app.use(express.static('frontend'));

  // Register API endpoints
  for (const [path, handler] of Object.entries(ENDPOINTS)) {
    app.get(`/api/${path}`, handler);
  }
  
  app.get('/', (req, res) => {
    res.sendFile('frontend/index.html', { root: '.' });
  });


  const server = app.listen(port, () => {
    console.log(`Interface opened on http://localhost:${port}`);
  });

  return server;
}
