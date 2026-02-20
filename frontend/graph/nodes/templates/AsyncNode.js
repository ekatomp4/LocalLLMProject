export default class AsyncNode {
    /**
     * @param {Function} asyncFn - async function that receives input and returns output
     * @param {string} inputType
     * @param {string} outputType
     */
    constructor(asyncFn, inputType, outputType) {
        this.addInput("input", inputType || 0);
        this.addOutput("output", outputType || 0);
        this.size = [220, 60];

        this.properties    = {};
        this._displayValue = "";
        this._pending      = false;
        this._asyncFn      = asyncFn;
        this.isError       = false;
    }

    static title = "Async Node";
    static desc  = "Base class for nodes that run async functions";

    _preview(value) {
        const str = typeof value === "object" ? JSON.stringify(value) : String(value);
        return str.length > 24 ? str.slice(0, 24) + "..." : str;
    }

    onExecute() {
        const input = this.getInputData(0);
        if (input === undefined) return;

        if (input !== this._lastInput && !this._pending) {
            this._lastInput = input;
            this._pending   = true;

            this._asyncFn(input)
                .then(result => {
                    this._displayValue = result;
                    this.setOutputData(0, result);
                    this.isError = false;
                })
                .catch(error => {
                    this.isError       = true;
                    this._displayValue = error.message || "Error";
                })
                .finally(() => {
                    this._pending = false;
                });
        } else {
            this.setOutputData(0, this._displayValue);
        }
    }

    onDrawBackground(ctx) {
        ctx.fillStyle = this.isError   ? "#aa4444"
                      : this._pending  ? "#4444aa"
                      :                  "#222";

        ctx.fillRect(0, 0, this.size[0], this.size[1]);

        ctx.fillStyle = "#fff";
        ctx.font      = "12px monospace";
        ctx.fillText(
            this._displayValue ? this._preview(this._displayValue) : "Waiting...",
            10, 20
        );
    }
}