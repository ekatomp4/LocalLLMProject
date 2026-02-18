import express from 'express';

export function startExpress(port) {
  const app = express();

  app.use(express.static('frontend'));

  app.get('/', (req, res) => {
    res.sendFile('frontend/index.html', { root: '.' });
  });

  const server = app.listen(port, () => {
    console.log(`Interface opened on http://localhost:${port}`);
  });

  return server;
}
