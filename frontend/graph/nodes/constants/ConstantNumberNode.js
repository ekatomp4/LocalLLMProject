// Constant Number Node
export class ConstantNumberNode {
    constructor() {
        this.addOutput("value", "number");
        this.properties = { value: 0 };
        this.size = [220, 60];

        this.addWidget(
            "number",
            "Integer",
            this.properties.value,
            (v) => { this.properties.value = parseFloat(v) || 0; }
        );
    }

    static title = "Constant Number";
    static desc = "Outputs a Constant Number";

    onExecute() {
        this.setOutputData(0, this.properties.value);
    }
}

export default ConstantNumberNode;