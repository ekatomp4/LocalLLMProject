import fs from 'fs/promises';

const OLLAMA_URL = process.env.OLLAMA_HOST ?? "http://localhost:11434";

export class MemoryStore {
    constructor(embedder, filePath = "./memories.json") {
        this.embedder = embedder;
        this.memories = [];
        this._idCounter = 0;
        this.filePath = filePath;
    }

    async add(text, meta = {}) {
        const vector = await this.embedder.embed(text);
        const id = `mem_${++this._idCounter}`;
        this.memories.push({ id, text, vector, meta });
        return id;
    }

    async addBatch(texts, metas = []) {
        const vectors = await this.embedder.embedBatch(texts);
        for (let i = 0; i < texts.length; i++) {
            const id = `mem_${++this._idCounter}`;
            this.memories.push({ id, text: texts[i], vector: vectors[i], meta: metas[i] ?? {} });
        }
    }

    async search(query, topK = 5) {
        const qVec = await this.embedder.embed(query);
        return this.memories
            .map(m => ({ ...m, score: cosineSimilarity(qVec, m.vector) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    remove(id) {
        this.memories = this.memories.filter(m => m.id !== id);
    }

    clear() {
        this.memories = [];
    }

    // ===== SAVE / LOAD =====

    async save() {
        const dir = `./memory`;
        const filePath = `${dir}/${this.embedder.model.replace(/:/g, "_")}.json`;
    
        await fs.mkdir(dir, { recursive: true });
    
        const data = {
            model: this.embedder.model,
            idCounter: this._idCounter,
            memories: this.memories.map(({ id, text, meta, vector }) => ({ id, text, meta, vector })),
        };
    
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`[MemoryStore] Saved ${this.memories.length} memories to ${filePath}`);
    }
    
    async load() {
        const dir = `./memory`;
        const filePath = `${dir}/${this.embedder.model.replace(/:/g, "_")}.json`;
    
        await fs.mkdir(dir, { recursive: true });
    
        let raw;
        try {
            raw = await fs.readFile(filePath, "utf-8");
        } catch {
            console.warn(`[MemoryStore] No save file found at ${filePath}, starting fresh.`);
            return false;
        }
    
        const data = JSON.parse(raw);
        this._idCounter = data.idCounter ?? 0;
        this.memories = [];
    
        const modelChanged = data.model !== this.embedder.model;
    
        if (modelChanged) {
            console.log(`[MemoryStore] Model changed (${data.model} → ${this.embedder.model}), re-embedding...`);
            const texts = data.memories.map(m => m.text);
            const vectors = await this.embedder.embedBatch(texts);
            for (let i = 0; i < data.memories.length; i++) {
                this.memories.push({
                    id:     data.memories[i].id,
                    text:   data.memories[i].text,
                    meta:   data.memories[i].meta,
                    vector: vectors[i],
                });
            }
        } else {
            console.log(`[MemoryStore] Model unchanged, loading vectors directly.`);
            for (const m of data.memories) {
                this.memories.push({ id: m.id, text: m.text, meta: m.meta, vector: m.vector });
            }
        }
    
        console.log(`[MemoryStore] Loaded ${this.memories.length} memories.`);
        return true;
    }
    
}

function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot   += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}