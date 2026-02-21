export default class MultilineTextOutputNode {
    constructor() {
        this.addInput("text", 0);
        this.addOutput("text", "string");
        this.properties = { value: "" };
        this.size = [400, 200];
        this._div = null;
        this._lastSyncKey = null;
    }

    static title = "Multiline Text Output";
    static desc = "Scrollable multiline text display node";

    onExecute() {
        const input = this.getInputData(0);
        if (input !== undefined && input !== null) {
            this.properties.value = String(input);
        }
        this._syncDiv();
        this.setOutputData(0, this.properties.value);
    }

    _createDiv() {
        const div = document.createElement("div");
        div.classList.add("multiline-text");
        document.querySelector("#main").appendChild(div);
        this._div = div;
    }

    _syncDiv() {
        if (!this._div) return;
    
        const lg = window.__lgCanvas;
        const canvasEl = document.querySelector("#graphcanvas");
        const rect = canvasEl.getBoundingClientRect();
        const ds = lg.ds ?? {};
        const scale = ds.scale ?? 1;
        const offset = ds.offset ?? [0, 0];
    
        const x = rect.left + (this.pos[0] + offset[0]) * scale;
        const y = rect.top + (this.pos[1] + offset[1]) * scale;
        const w = this.size[0] * scale;
        const h = this.size[1] * scale;
        const titleH = 20 * scale;
    
        const key = `${x},${y},${w},${h},${scale},${this.properties.value}`;
        if (key === this._lastSyncKey) return;
        this._lastSyncKey = key;
    
        this._div.style.left     = `${x}px`;
        this._div.style.top      = `${y + titleH}px`;
        this._div.style.width    = `${w}px`;
        this._div.style.height   = `${h}px`;
        this._div.style.fontSize = `${Math.max(10, 12 * scale)}px`;
        this._div.textContent    = this.properties.value || "";
    }

    onDrawBackground(ctx) {
        // Draw a dark background so the node body isn't blank under the div
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.size[0], this.size[1]);

        if (!this._div) this._createDiv();
        this._syncDiv();
    }

    onRemoved() {
        if (this._div) {
            this._div.remove();
            this._div = null;
        }
    }
}