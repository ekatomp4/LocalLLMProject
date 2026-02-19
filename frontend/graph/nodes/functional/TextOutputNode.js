export default class TextOutputNode {
    constructor() {
        this.addInput("text", 0); // accept any type
        this.size = [220, 60];
        this.properties = {};
        this._displayValue = "";
    }

    static title = "Text Output";
    static desc = "Displays incoming text or any value";

    onExecute() {
        const input = this.getInputData(0);
        if (input !== undefined) {
            // convert anything to string for display
            this._displayValue = String(input);
        }
    }

    onDrawBackground(ctx) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);

        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.fillText(this._displayValue || "Waiting...", 10, 30);
    }
}
