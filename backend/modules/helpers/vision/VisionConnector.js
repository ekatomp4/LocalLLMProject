import fs from 'fs/promises';
import sharp from 'sharp';

const OLLAMA_URL = process.env.OLLAMA_HOST ?? "http://localhost:11434";

export class VisionConnector {
    constructor(model = "moondream", maxSize = 512) {
        this.model = model;
        this.maxSize = maxSize;
    }

    async _prepareImage(input) {
        // accepts a file path, buffer, or base64 string
        let buffer;
        if (typeof input === "string" && !input.startsWith("data:") && !this._isBase64(input)) {
            buffer = await fs.readFile(input);
        } else if (typeof input === "string") {
            const base64 = input.replace(/^data:image\/\w+;base64,/, "");
            buffer = Buffer.from(base64, "base64");
        } else {
            buffer = input;
        }

        const resized = await sharp(buffer)
            .resize(this.maxSize, this.maxSize, { fit: "inside" })
            .jpeg({ quality: 80 })
            .toBuffer();

        return resized.toString("base64");
    }

    _isBase64(str) {
        try {
            return Buffer.from(str, "base64").toString("base64") === str;
        } catch {
            return false;
        }
    }

    async describe(input, prompt = "Describe this image in detail.") {
        const base64 = await this._prepareImage(input);

        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                stream: false,
                messages: [{
                    role: "user",
                    content: prompt,
                    images: [base64],
                }],
            }),
        });

        if (!res.ok) throw new Error(`Vision error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        return data.message.content;
    }

    async describeStream(input, prompt = "Describe this image in detail.", { onChunk, onDone } = {}) {
        const base64 = await this._prepareImage(input);

        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                stream: true,
                messages: [{
                    role: "user",
                    content: prompt,
                    images: [base64],
                }],
            }),
        });

        if (!res.ok) throw new Error(`Vision error: ${res.status} ${res.statusText}`);

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value).split("\n").filter(Boolean);
            for (const line of lines) {
                try {
                    const json  = JSON.parse(line);
                    const token = json.message?.content ?? "";
                    full += token;
                    onChunk?.(token, full);
                    if (json.done) onDone?.(full);
                } catch { }
            }
        }

        return full;
    }
}

export default VisionConnector;