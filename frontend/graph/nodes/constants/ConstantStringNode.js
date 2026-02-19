// Constant String Node
export class ConstantStringNode {
    constructor() {
        this.addOutput("value", "string");
        this.properties = { value: "" };
        this.size = [220, 60];

        this.addWidget(
            "text",
            "String",
            this.properties.value,
            (v) => { this.properties.value = v; }
        );
    }

    static title = "Constant String";
    static desc = "Outputs a constant string";

    onExecute() {
        this.setOutputData(0, this.properties.value);
    }
}



export default ConstantStringNode;