import AsyncNode from "../templates/AsyncNode.js";

const OLLAMA_URL = "http://localhost:11434";

class LLMCallNode extends AsyncNode {
    constructor() {
        super(async (prompt) => {
            const body = {
                model: "gemma3:1b",
                messages: [{ role: "user", content: prompt }],
                stream: false,
            };
            if (this.properties.format === "json") body.format = "json";

            const res = await fetch(`${OLLAMA_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
            const data = await res.json();
            return data.message.content;
        }, "string", "string");

        this.properties = { format: "text" };
        this.size = [220, 80];

        this.addWidget(
            "combo",
            "Format",
            this.properties.format,
            (v) => { this.properties.format = v; },
            { values: ["text", "json"] }
        );
    }

    static title = "LLM Call";
    static desc = "Sends a prompt to Ollama and returns the response";
}

export default LLMCallNode;