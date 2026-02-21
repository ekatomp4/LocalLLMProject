export default class ObjectEditorNode {
    constructor() {
        this.addInput("object", 0);
        this.addOutput("object", "object");

        this.properties = { json: "{}" };
        this.size = [320, 200];
        this._div        = null;
        this._textarea   = null;
        this._status     = null;
        this._lastInputStr = null;
        this._focused    = false;
        this._valid      = true;
    }

    static title = "Object Editor";
    static desc  = "Edit a JSON object directly — supports nesting";

    onExecute() {
        const input = this.getInputData(0);

        if (input !== undefined && input !== null && !this._focused) {
            // Normalize input — parse string, use object directly
            let src = {};
            if (typeof input === "string") {
                try { src = JSON.parse(input); } catch {}
            } else if (typeof input === "object" && !Array.isArray(input)) {
                src = input;
            }

            // Compare by value so we don't re-merge every tick
            const inputStr = JSON.stringify(src);
            if (inputStr !== this._lastInputStr) {
                this._lastInputStr = inputStr;
                try {
                    const current = JSON.parse(this.properties.json || "{}");
                    // src provides new keys, current (user edits) wins on conflicts
                    const merged = Object.assign({}, src, current);
                    this.properties.json = JSON.stringify(merged, null, 2);
                    if (this._textarea) this._textarea.value = this.properties.json;
                    this._valid = true;
                } catch {}
            }
        }

        if (this._valid) {
            let obj = {};
            try { obj = JSON.parse(this.properties.json || "{}"); } catch {}
            this.setOutputData(0, obj);
        }

        this._syncDiv();
    }

    _createDiv() {
        if (!document.getElementById("obj-editor-styles")) {
            const style = document.createElement("style");
            style.id = "obj-editor-styles";
            style.textContent = `
                .obj-editor {
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
                .obj-editor textarea {
                    flex: 1;
                    background: #111;
                    border: 1px solid #444;
                    color: #aaffaa;
                    padding: 6px;
                    border-radius: 3px;
                    font-family: monospace;
                    font-size: 11px;
                    resize: none;
                    outline: none;
                    line-height: 1.5;
                    white-space: pre;
                    overflow-wrap: normal;
                    overflow-x: auto;
                    tab-size: 2;
                }
                .obj-editor textarea:focus { border-color: #aaaaff; }
                .obj-editor textarea.error { border-color: #aa4444 !important; color: #ff9999; }
                .obj-editor .obj-status {
                    font-size: 10px;
                    color: #888;
                    flex-shrink: 0;
                    padding: 1px 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .obj-editor .obj-status.ok  { color: #44cc88; }
                .obj-editor .obj-status.err { color: #ff6666; }
            `;
            document.head.appendChild(style);
        }

        const div = document.createElement("div");
        div.className = "obj-editor";

        const ta = document.createElement("textarea");
        ta.value      = this.properties.json || "{}";
        ta.spellcheck = false;
        this._textarea = ta;

        const status = document.createElement("div");
        status.className   = "obj-status ok";
        status.textContent = "✓ valid JSON";
        this._status = status;

        ta.addEventListener("focus", () => { this._focused = true; });
        ta.addEventListener("blur",  () => {
            this._focused = false;
            this._commit(ta.value);
        });

        ta.addEventListener("input", (e) => {
            try {
                JSON.parse(e.target.value);
                this.properties.json   = e.target.value;
                this._valid            = true;
                ta.classList.remove("error");
                status.className   = "obj-status ok";
                status.textContent = "✓ valid JSON";
            } catch (err) {
                this._valid            = false;
                ta.classList.add("error");
                status.className   = "obj-status err";
                status.textContent = "✗ " + err.message.split("\n")[0].slice(0, 60);
            }
        });

        ta.addEventListener("keydown", (e) => {
            e.stopPropagation();
            if (e.key === "Tab") {
                e.preventDefault();
                const start = ta.selectionStart;
                const end   = ta.selectionEnd;
                ta.value = ta.value.slice(0, start) + "  " + ta.value.slice(end);
                ta.selectionStart = ta.selectionEnd = start + 2;
            }
        });

        div.appendChild(ta);
        div.appendChild(status);
        document.querySelector("#main").appendChild(div);
        this._div = div;
    }

    _commit(value) {
        try {
            JSON.parse(value);
            this.properties.json = value;
            this._valid          = true;
            if (this._status)   { this._status.className = "obj-status ok"; this._status.textContent = "✓ valid JSON"; }
            if (this._textarea)   this._textarea.classList.remove("error");
        } catch (err) {
            this._valid = false;
            if (this._status)   { this._status.className = "obj-status err"; this._status.textContent = "✗ " + err.message.split("\n")[0].slice(0, 60); }
        }
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

        if (this._textarea && !this._focused) {
            this._textarea.value = this.properties.json;
        }
    }

    onDrawBackground(ctx) {
        ctx.fillStyle   = this._valid ? "#1a1a1a" : "#1a1010";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
        ctx.strokeStyle = this._valid ? "#555" : "#aa4444";
        ctx.lineWidth   = 1;
        ctx.strokeRect(0, 0, this.size[0], this.size[1]);

        if (!this._div) this._createDiv();
        this._syncDiv();
    }

    onRemoved() {
        if (this._div) {
            this._div.remove();
            this._div      = null;
            this._textarea = null;
            this._status   = null;
        }
    }
}


// THIS DOES NOT WORK DOES NOT ALWAYS UPDATE WHEN INPUT CHANGED