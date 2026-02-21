export default class ChatInputNode {
    constructor() {
        this.addOutput("text", "string");
        this.properties = { value: "", submitted: "" };
        this.size = [400, 200];
        this._editing = false;
        this._textarea = null;
        this._lastClick = 0;
    }

    static title = "Chat Input";
    static desc = "Type text, click Submit to send. Clears input but holds output until next submit.";

    onExecute() {
        this.setOutputData(0, this.properties.submitted);
    }

    onDrawBackground(ctx) {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);

        ctx.strokeStyle = this._editing ? "#aaaaff" : "#444";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.size[0], this.size[1]);

        // Submit button
        const btnH = 28;
        const btnY = this.size[1] - btnH - 6;
        const btnX = this.size[0] - 90;
        ctx.fillStyle = "#334";
        ctx.fillRect(btnX, btnY, 84, btnH);
        ctx.strokeStyle = "#556";
        ctx.strokeRect(btnX, btnY, 84, btnH);
        ctx.fillStyle = "#aaaaff";
        ctx.font = "12px monospace";
        ctx.fillText("Submit", btnX + 22, btnY + 18);

        if (this._editing) return;

        const padding = 8;
        const lineHeight = 16;
        const maxWidth = this.size[0] - padding * 2;
        const maxY = btnY - padding;

        if (!this.properties.value) {
            ctx.fillStyle = "#555";
            ctx.font = "12px monospace";
            ctx.fillText("Double-click to edit...", padding, padding + 12);
            return;
        }

        ctx.fillStyle = "#cccccc";
        ctx.font = "12px monospace";

        const lines = this.properties.value.split("\n");
        let y = padding + 12;

        for (const line of lines) {
            if (y > maxY) {
                ctx.fillStyle = "#666";
                ctx.fillText("...", padding, y);
                break;
            }
            let remaining = line || " ";
            while (remaining.length > 0) {
                let chunk = remaining;
                while (ctx.measureText(chunk).width > maxWidth && chunk.length > 1) {
                    chunk = chunk.slice(0, -1);
                }
                ctx.fillText(chunk, padding, y);
                remaining = remaining.slice(chunk.length);
                y += lineHeight;
                if (y > maxY) break;
            }
        }
    }

    _submit() {
        if (!this.properties.value) return;
        this.properties.submitted = this.properties.value;
        this.properties.value = "";
        if (this._textarea) this._textarea.value = "";
        this.setDirtyCanvas(true);
    }

    onMouseDown(e, localPos) {
        // Check submit button hit
        const btnH = 28;
        const btnY = this.size[1] - btnH - 6;
        const btnX = this.size[0] - 90;
        if (
            localPos[0] >= btnX && localPos[0] <= btnX + 84 &&
            localPos[1] >= btnY && localPos[1] <= btnY + btnH
        ) {
            this._submit();
            return true;
        }

        // Double-click to edit
        const now = Date.now();
        const isDouble = now - this._lastClick < 400;
        this._lastClick = now;
        if (isDouble) {
            this._openTextarea();
            return true;
        }
    }

    _openTextarea() {
        if (this._editing) return;
        this._editing = true;

        const lg = window.__lgCanvas;
        const canvasEl = document.querySelector("#graphcanvas");
        const rect = canvasEl.getBoundingClientRect();

        const ds = lg.ds ?? {};
        const scale = ds.scale ?? 1;
        const offset = ds.offset ?? [0, 0];

        const nodeScreenX = rect.left + (this.pos[0] + offset[0]) * scale;
        const nodeScreenY = rect.top + (this.pos[1] + offset[1]) * scale;
        const nodeScreenW = this.size[0] * scale;
        const nodeScreenH = (this.size[1] - 40) * scale; // leave room for button
        const titleH = 20 * scale;

        const ta = document.createElement("textarea");
        ta.value = this.properties.value;
        ta.style.cssText = `
            position: fixed;
            left: ${nodeScreenX}px;
            top: ${nodeScreenY + titleH}px;
            width: ${nodeScreenW}px;
            height: ${nodeScreenH}px;
            background: #1a1a1a;
            color: #cccccc;
            border: 1px solid #aaaaff;
            font: ${Math.max(11, 12 * scale)}px monospace;
            padding: 8px;
            box-sizing: border-box;
            resize: none;
            z-index: 9999;
            outline: none;
            line-height: 1.4;
            pointer-events: all;
        `;

        document.body.appendChild(ta);
        this._textarea = ta;

        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);
        }, 0);

        const close = () => {
            if (!this._textarea) return;
            this.properties.value = ta.value;
            ta.removeEventListener("blur", close);
            document.body.removeChild(ta);
            this._textarea = null;
            this._editing = false;
            this.setDirtyCanvas(true);
        };

        ta.addEventListener("input", () => {
            this.properties.value = ta.value;
            this.setDirtyCanvas(true);
        });

        ta.addEventListener("blur", close);

        ta.addEventListener("keydown", (e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
                ta.removeEventListener("blur", close);
                if (this._textarea) {
                    document.body.removeChild(ta);
                    this._textarea = null;
                    this._editing = false;
                    this.setDirtyCanvas(true);
                }
            }
            if (e.key === "Enter" && e.ctrlKey) {
                this._submit();
            }
        });
    }

    onRemoved() {
        if (this._textarea) {
            document.body.removeChild(this._textarea);
            this._textarea = null;
            this._editing = false;
        }
    }
}