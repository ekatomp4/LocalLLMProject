export default class JsonStringifyNode {
    constructor() {
        this.addInput("object", 0); // 0 = any type
        this.addOutput("json", "string");
        this.addOutput("error", "string");

        this.properties = { pretty: true, indent: 2 };
        this.size = [220, 80];
        this._error = "";

        this.addWidget(
            "toggle",
            "Pretty Print",
            this.properties.pretty,
            (v) => { this.properties.pretty = v; }
        );

        this.addWidget(
            "number",
            "Indent",
            this.properties.indent,
            (v) => { this.properties.indent = parseInt(v) || 2; }
        );
    }

    static title = "JSON Stringify";
    static desc = "Serializes an object to a JSON string";

    onExecute() {
        const input = this.getInputData(0);

        if (input === undefined || input === null) return;

        try {
            const indent = this.properties.pretty ? this.properties.indent : null;
            const result = JSON.stringify(input, null, indent);
            this.setOutputData(0, result);
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
        ctx.fillText("Stringify error", 10, 20);
    }
}