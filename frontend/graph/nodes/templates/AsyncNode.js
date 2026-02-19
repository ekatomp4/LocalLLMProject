export default class AsyncNode {
    /**
     * @param {Function} asyncFn - async function that receives input(s) and returns output
     *   signature: asyncFn(inputs: array of inputData) => any
     */
    constructor(asyncFn, inputType, outputType) {
        this.addInput("input", inputType || 0);   // generic input slot
        this.addOutput("output", outputType || 0); // generic output slot
        this.size = [220, 60];

        this.properties = {};
        this._displayValue = "";
        this._pending = false;  // prevent overlapping calls
        this._asyncFn = asyncFn;
    }

    static title = "Async Node";
    static desc = "Base class for nodes that run async functions";

    onExecute() {
        const input = this.getInputData(0);
    
        // ignore if no input
        if (input === undefined) return;
    
        // only fetch if input is different and not already pending
        if (input !== this._lastInput && !this._pending) {
            this._lastInput = input;
            this._pending = true;
    
            this._asyncFn(input)
                .then(result => {
                    this._displayValue = result;
                    this.setOutputData(0, result);
                })
                .finally(() => {
                    this._pending = false;
                });
        } else {
            // keep output stable
            this.setOutputData(0, this._displayValue);
        }
    }
    

    onDrawBackground(ctx) {
        // change color based on pending state
        if (this._pending) {
            ctx.fillStyle = "#4444aa"; // processing color
        } else {
            ctx.fillStyle = "#222";    // idle color
        }
    
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
    
        // draw text
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.fillText(this._displayValue || "Waiting...", 10, 30);
    }
    
}
