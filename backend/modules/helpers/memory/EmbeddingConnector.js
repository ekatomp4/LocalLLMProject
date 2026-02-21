const OLLAMA_URL = process.env.OLLAMA_HOST ?? "http://localhost:11434";

export class EmbeddingConnector {
    // or "qwen3-embedding:4b"
    constructor(model = "nomic-embed-text") {
        this.model = model;
    }

    async embed(text) {
        const res = await fetch(`${OLLAMA_URL}/api/embed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, input: text }),
        });
        const data = await res.json();
        return data.embeddings[0]; // float[]
    }

    async embedBatch(texts) {
        const res = await fetch(`${OLLAMA_URL}/api/embed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, input: texts }),
        });
        const data = await res.json();
        return data.embeddings;
    }
}