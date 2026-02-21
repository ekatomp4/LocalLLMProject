export default class JsonParseNode {
    constructor() {
        this.addInput("json", "string");
        this.addOutput("object", "object");
        this.addOutput("error", "string");

        this.properties = {};
        this.size = [220, 60];
        this._error = "";
    }

    static title = "JSON Parse";
    static desc = "Parses a JSON string into an object";

    onExecute() {
        const input = this.getInputData(0);

        if (input === undefined || input === null) return;

        try {
            const parsed = JSON.parse(input);
            this.setOutputData(0, parsed);
            this.setOutputData(1, "");
            this._error = "";
        } catch (e) {
            this.setOutputData(0, null);
            this.setOutputData(1, e.message);
            this._error = e.message;
        }
    }

    onDrawBackground(ctx) {
        if (!this._error) return;
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
        ctx.fillStyle = "#fff";
        ctx.font = "11px sans-serif";
        ctx.fillText("Parse error", 10, 20);
    }
}