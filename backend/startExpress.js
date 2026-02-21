import express from 'express';

import { runCommand } from './modules/helpers/runCommand.js';
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
  "cmd": {
    "POST": async (req, res) => {
      try {
        const parsedBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const command = parsedBody.command;
        if (!command || command.trim().length === 0) {
          res.status(400).json({ error: "Missing 'command' in request body" });
          return;
        }
        const exitCode = await runCommand(command);
        res.json({ exitCode });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      }
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
  app.use(express.json());

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



// EMBEDDING TEST

// import { EmbeddingConnector } from './modules/helpers/memory/EmbeddingConnector.js';
// import { MemoryStore } from './modules/helpers/memory/MemoryStore.js';

// const embedder = new EmbeddingConnector();
// const memory = new MemoryStore(embedder);

// // ===== MEMORIES =====
// const memories = [
//     "The user likes cats",
//     "The user dislikes loud music",
//     "The user prefers concise responses",
//     "The user enjoys dark mode interfaces",
//     "The user drinks coffee in the morning",
//     "The user is building a node graph editor",
//     "The user is using LiteGraph as the graph framework",
//     "The user has a local Ollama server running on port 11434",
//     "The user has a local command server running on port 6555",
//     "The user is writing nodes in vanilla JavaScript ES modules",
//     "The project uses SVG for AI drawing output",
//     "The project has an LLM stream node and an LLM call node",
//     "The project auto-saves the graph to localStorage every 5 seconds",
//     "The project has a memory store backed by cosine similarity search",
//     "The embedding model being used is qwen3-embedding:4b",
//     "The user asked how to stop emojis from appearing in LLM responses",
//     "The user asked how to make widget values persist after graph reload",
//     "The user wants AI nodes that can draw SVG diagrams",
//     "The user is testing a fake in-memory vector database",
//     "The user prefers whole file responses over partial snippets",
// ];

// console.log("=== LOADING MEMORIES ===\n");
// let addMs = 0;

// const loaded = await memory.load();

// if (!loaded) {
//     console.log("=== ADDING MEMORIES (addBatch) ===\n");
//     const addStart = performance.now();
//     await memory.addBatch(memories);
//     addMs = performance.now() - addStart;
//     await memory.save();
// }

// console.log(`Batch embed time:  ${addMs.toFixed(1)}ms`);

// // ===== QUERIES =====
// const queries = [
//     "what is the user currently building?",
//     "what are the user's personal preferences?",
//     "what ports is the server running on?",
//     "how does the project handle saving?",
//     "what models are being used?",
//     "what did the user ask about recently?",
//     "what language and framework is the project using?",
// ];

// console.log("=== SEARCHING ===\n");
// let totalSearchTime = 0;
// let searchCount = 0;

// for (const q of queries) {
//     const start = performance.now();
//     const results = await memory.search(q, 3);
//     const ms = performance.now() - start;
//     totalSearchTime += ms;
//     searchCount++;
//     console.log(`\nQuery: "${q}" (${ms.toFixed(1)}ms)`);
//     for (const r of results) {
//         console.log(`  [${r.score.toFixed(4)}] ${r.text}`);
//     }
// }

// // ===== SUMMARY =====
// console.log("\n=== PERFORMANCE SUMMARY ===");
// console.log(`Memories added:    ${memories.length}`);
// console.log(`Batch embed time:  ${addMs.toFixed(1)}ms`);
// console.log(`Avg per memory:    ${(addMs / memories.length).toFixed(1)}ms`);
// console.log(`Total search time: ${totalSearchTime.toFixed(1)}ms`);
// console.log(`Avg per query:     ${(totalSearchTime / searchCount).toFixed(1)}ms`);


import VisionConnector from './modules/helpers/vision/VisionConnector.js';

const vision = new VisionConnector("moondream");

const prompts = [
    "What is in this image? Be very brief.",
    "",
    "briefly"
];

const imagePath = "./tests/images/image.png";

console.log("=== VISION PERFORMANCE TEST ===\n");

for (const prompt of prompts) {
    console.log(`Prompt: "${prompt}"`);
    const start = performance.now();
    let tokenCount = 0;

    const result = await vision.describeStream(imagePath, prompt, {
      onChunk: (token) => { tokenCount++; },
    });
  
    const cleaned = result.trim();

    const ms = performance.now() - start;
    console.log(`Result:  ${cleaned || "(empty response)"}`);
    console.log(`Time:    ${ms.toFixed(1)}ms`);
    console.log(`Tokens:  ~${tokenCount}`);
    console.log(`ms/tok:  ${(ms / tokenCount).toFixed(1)}ms`);
    console.log();
}