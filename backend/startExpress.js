import express from 'express';


import LLMConnector, { LLMOptions } from "./modules/helpers/LLMConnector.js";

const llm = new LLMConnector("gemma3:1b", new LLMOptions({
  temperature: 0.1,      // more focused
  topP: 0.85,
  topK: 20,
  numCtx: 8192,          // bigger context
  numPredict: 500,       // cap output length
  repeatPenalty: 1.2,
  seed: 42,              // reproducible
  format: "json",
  // stop: ["**"],
  keepAlive: "10m",
}))
// // llm.chat("hello").then(reply => console.log(reply)).catch(console.error);
// // get models
// llm.getModels().then(models => console.log("Available Models:", models.map(model => model.name))).catch(console.error);
// llm.completeStream("Write me a poem about grass please", {
//   onChunk: (token) => process.stdout.write(token),
//   onDone: (full) => console.log("\n--- done ---")
// });


const ENDPOINTS = {
  "ping": {
    "GET": (req, res) => {
      res.send("pong");
    }
  },
  "chat": {
    "POST": async (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const { message, format } = req.body;
      if (!message || message.trim().length === 0) {
        res.status(400).json({ error: "Missing 'message' in request body" });
        return;
      }

      await llm.completeStream(message, {
        format: format,
        onChunk: (token) => {
          res.write(`data: ${JSON.stringify({ token: llm.cleanRes(token) })}\n\n`);
        },
        onDone: (full) => {
          res.write(`data: ${JSON.stringify({ done: true, full })}\n\n`);
          res.end();
        }
      });
    }
  }
};

export function startExpress(port) {
  const app = express();

  app.use(express.static('frontend'));

  // Register API endpoints
  for (const [path, handler] of Object.entries(ENDPOINTS)) {
    // app.get(`/api/${path}`, handler);
    for (const [method, fn] of Object.entries(handler)) {
      app[method.toLowerCase()](`/api/${path}`, fn);
    }
  }

  app.get('/', (req, res) => {
    res.sendFile('frontend/index.html', { root: '.' });
  });


  const server = app.listen(port, () => {
    console.log(`Interface opened on http://localhost:${port}`);
  });

  return server;
}

