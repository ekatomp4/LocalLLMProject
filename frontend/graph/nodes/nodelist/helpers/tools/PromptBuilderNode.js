export default class PromptBuilderNode {
    constructor() {
        this.addInput("vars", "object");   // object whose keys become variables
        this.addOutput("prompt", "string");

        this.properties = { template: "Hello ${name}, your score is ${score}!" };
        this.size = [340, 160];
        this._div = null;
        this._result = "";
        this._error = "";
    }

    static title = "Prompt Builder";
    static desc = 'Builds a string from a template using ${key} substitution';

    onExecute() {
        const vars = this.getInputData(0) ?? {};

        try {
            // Replace ${key} and ${key.nested} with values from vars object
            const result = this.properties.template.replace(/\$\{([^}]+)\}/g, (match, path) => {
                const value = path.trim().split(".").reduce((obj, key) => obj?.[key], vars);
                return value !== undefined ? String(value) : match;
            });

            this._result = result;
            this._error  = "";
            this.setOutputData(0, result);
        } catch (e) {
            this._error = e.message;
        }

        this._syncDiv();
    }

    _createDiv() {
        if (!document.getElementById("prompt-builder-styles")) {
            const style = document.createElement("style");
            style.id = "prompt-builder-styles";
            style.textContent = `
                .prompt-builder {
                    position: fixed;
                    background: #1a1a1a;
                    border: 1px solid #555;
                    box-sizing: border-box;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    font-family: monospace;
                    font-size: 11px;
                    padding: 4px;
                    gap: 4px;
                }
                .prompt-builder label {
                    color: #888;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .prompt-builder textarea {
                    flex: 1;
                    background: #111;
                    border: 1px solid #444;
                    color: #ffddaa;
                    padding: 6px;
                    border-radius: 3px;
                    font-family: monospace;
                    font-size: 11px;
                    resize: none;
                    outline: none;
                    line-height: 1.5;
                }
                .prompt-builder textarea:focus { border-color: #888; }
                .prompt-builder .preview {
                    background: #0f1a0f;
                    border: 1px solid #363;
                    border-radius: 3px;
                    color: #aaffaa;
                    padding: 4px 6px;
                    font-size: 10px;
                    line-height: 1.4;
                    max-height: 60px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                    word-break: break-word;
                    flex-shrink: 0;
                }
                .prompt-builder .preview.error { color: #ff6666; border-color: #622; background: #1a0f0f; }
            `;
            document.head.appendChild(style);
        }

        const div = document.createElement("div");
        div.className = "prompt-builder";

        const templateLabel = document.createElement("label");
        templateLabel.textContent = "Template";

        const ta = document.createElement("textarea");
        ta.value = this.properties.template;
        ta.spellcheck = false;
        this._textarea = ta;

        ta.addEventListener("keydown", e => e.stopPropagation());
        ta.addEventListener("input", (e) => {
            this.properties.template = e.target.value;
        });

        const previewLabel = document.createElement("label");
        previewLabel.textContent = "Preview";

        const preview = document.createElement("div");
        preview.className = "preview";
        this._preview = preview;

        div.appendChild(templateLabel);
        div.appendChild(ta);
        div.appendChild(previewLabel);
        div.appendChild(preview);
        document.querySelector("#main").appendChild(div);
        this._div = div;
    }

    _syncDiv() {
        if (!this._div) return;

        const lg       = window.__lgCanvas;
        const canvasEl = document.querySelector("#graphcanvas");
        const rect     = canvasEl.getBoundingClientRect();
        const ds       = lg.ds ?? {};
        const scale    = ds.scale ?? 1;
        const offset   = ds.offset ?? [0, 0];

        const x      = rect.left + (this.pos[0] + offset[0]) * scale;
        const y      = rect.top  + (this.pos[1] + offset[1]) * scale;
        const w      = this.size[0] * scale;
        const h      = this.size[1] * scale;
        const titleH = 20 * scale;

        this._div.style.left     = `${x}px`;
        this._div.style.top      = `${y + titleH}px`;
        this._div.style.width    = `${w}px`;
        this._div.style.height   = `${h}px`;
        this._div.style.fontSize = `${Math.max(10, 11 * scale)}px`;

        if (this._preview) {
            if (this._error) {
                this._preview.textContent = "Error: " + this._error;
                this._preview.className = "preview error";
            } else {
                this._preview.textContent = this._result || "(no output)";
                this._preview.className = "preview";
            }
        }

        if (this._textarea && document.activeElement !== this._textarea) {
            this._textarea.value = this.properties.template;
        }
    }

    onDrawBackground(ctx) {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.size[0], this.size[1]);

        if (!this._div) this._createDiv();
        this._syncDiv();
    }

    onRemoved() {
        if (this._div) {
            this._div.remove();
            this._div = null;
            this._textarea = null;
            this._preview = null;
        }
    }
}