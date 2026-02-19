export default class ToStringNode {
    constructor() {
        // Input: any type
        this.addInput("input", "number");  

        // Output: string
        this.addOutput("output", "string");

        this.properties = { defaultValue: "" };
        this.size = [220, 60];

        // Widget to set a default fallback value
        this.addWidget(
            "text",
            "Default",
            this.properties.defaultValue,
            (v) => { this.properties.defaultValue = v; }
        );
    }

    static title = "To String";
    static desc = "Converts any input to string";

    onExecute() {
        let input = this.getInputData(0);

        if (input === undefined || input === null) {
            input = this.properties.defaultValue;
        }

        this.setOutputData(0, String(input));
    }
}
