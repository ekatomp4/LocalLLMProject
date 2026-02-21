export default class TextOutputNode {
    constructor() {
        this.addInput("text", 0);
        this.addOutput("text", "string");
        this.size = [220, 60];
        this.properties = {};
        this._displayValue = "";
        this._lines = [];
    }

    static title = "Text Output";
    static desc = "Displays incoming text or any value";

    _wrap(ctx, text, maxWidth) {
        const words = text.split(" ");
        const lines = [];
        let current = "";

        for (const word of words) {
            // handle hard newlines
            const parts = word.split("\n");
            for (let i = 0; i < parts.length; i++) {
                const test = current ? `${current} ${parts[i]}` : parts[i];
                if (ctx.measureText(test).width > maxWidth && current) {
                    lines.push(current);
                    current = parts[i];
                } else {
                    current = test;
                }
                // hard newline forces a break
                if (i < parts.length - 1) {
                    lines.push(current);
                    current = "";
                }
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    onExecute() {
        const input = this.getInputData(0);
        if (input !== undefined) {
            this._displayValue = typeof input === "object"
                ? JSON.stringify(input, null, 2)
                : String(input);
        }
        this.setOutputData(0, this._displayValue);
    }

    onDrawBackground(ctx) {
        const padding    = 8;
        const lineHeight = 16;
        const maxWidth   = this.size[0] - padding * 2;

        ctx.font = "12px monospace";

        // Compute wrapped lines
        this._lines = this._displayValue
            ? this._wrap(ctx, this._displayValue, maxWidth)
            : ["No data"];

        // Resize node height to fit all lines
        const newHeight = this._lines.length * lineHeight + padding * 2;
        if (Math.abs(this.size[1] - newHeight) > 2) {
            this.size[1] = newHeight;
        }

        // Background
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);

        // Text
        ctx.fillStyle = this._displayValue ? "#fff" : "#666";
        this._lines.forEach((line, i) => {
            ctx.fillText(line, padding, padding + 12 + i * lineHeight);
        });
    }
}