import LLMCallNode from "./LLMCallNode.js";

const OLLAMA_URL = "http://localhost:11434";

class LLMStreamNode extends LLMCallNode {
    constructor() {
        super();

        this.addOutput("chunk",       "string");
        this.addOutput("finalOutput", "string");

        this._streamValue = "";
        this._streaming   = false;
        this._finalOutput = "";
        this.size         = [220, 120];
    }

    static title = "LLM Stream";
    static desc  = "Streams tokens from Ollama. Outputs running string, chunks, and final output.";

    onExecute() {
        const input = this.getInputData(0);
        if (input === undefined || input === null) return null;

        if (input !== this._lastInput && !this._pending) {
            this._lastInput   = input;
            this._pending     = true;
            this._streaming   = true;
            this._streamValue = "";
            this._finalOutput = "";

            this.setOutputData(2, undefined);

            const extra = this.properties.extra;
            const full  = extra ? `${input}\n${extra}` : input;

            const body = {
                model: "gemma3:1b",
                messages: [{ role: "user", content: full }],
                stream: true,
            };
            if (this.properties.format === "json") body.format = "json";

            fetch(`${OLLAMA_URL}/api/chat`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(body),
            })
            .then(async (res) => {
                if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

                const reader  = res.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const lines = decoder.decode(value).split("\n").filter(Boolean);
                    for (const line of lines) {
                        try {
                            const json  = JSON.parse(line);
                            const token = json.message?.content ?? "";
                            this._streamValue += token;

                            this.setOutputData(0, this._streamValue);
                            this.setOutputData(1, token);
                        } catch {
                            // malformed chunk, skip
                        }
                    }
                }

                this._finalOutput  = this._streamValue;
                this._displayValue = this._streamValue;
                this.isError       = false;

                this.setOutputData(2, this._finalOutput);
            })
            .catch(err => {
                this.isError       = true;
                this._displayValue = err.message || "Error";
            })
            .finally(() => {
                this._pending   = false;
                this._streaming = false;
                this.setOutputData(1, "");
            });
        } else {
            this.setOutputData(0, this._streamValue || this._displayValue);
            this.setOutputData(2, this._finalOutput || undefined);
        }
    }

    onDrawBackground(ctx) {
        ctx.fillStyle = this.isError      ? window.graphColors?.error      ?? "#5a1a1a"
                      : this._streaming   ? window.graphColors?.partial     ?? "#1a4a4a"
                      : this._finalOutput ? window.graphColors?.processing  ?? "#2a1a4a"
                      :                    window.graphColors?.default      ?? "#222";

        ctx.fillRect(0, 0, this.size[0], this.size[1]);

        ctx.fillStyle = "#fff";
        ctx.font      = "12px monospace";

        const full    = this._streamValue || this._displayValue || "";
        const preview = full.length > 24 ? "..." + full.slice(-24) : full;
        ctx.fillText(preview || "Waiting...", 8, 20);

        ctx.fillStyle = this.isError      ? "#ff6666"
                      : this._streaming   ? "#44dddd"
                      : this._finalOutput ? "#aa88ff"
                      :                    "#666";
        ctx.font      = "10px monospace";
        ctx.fillText(
            this.isError      ? "● error"
          : this._streaming   ? "● streaming"
          : this._finalOutput ? "● done"
          :                     "● idle",
            8, 36
        );
    }
}

export default LLMStreamNode;