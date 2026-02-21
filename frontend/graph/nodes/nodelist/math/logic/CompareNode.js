export default class CompareNode {
    constructor() {
        // Inputs
        this.addInput("A", 0);
        this.addInput("B", 0);

        // Output
        this.addOutput("Result", "boolean");

        this.size = [220, 80];

    }

    static title = "Compare";
    static desc = "Compares 2 values for equality";

    onExecute() {
        const a = this.getInputData(0);
        const b = this.getInputData(1);
        this.setOutputData(0, a == b);
    }
}
