export default class ToNumberNode {
    constructor() {
        // Input: any type (string or number)
        this.addInput("input", "string");  

        // Output: integer
        this.addOutput("output", "number");

        this.properties = { defaultValue: 0 };
        this.size = [220, 60];

        // Widget to set a default fallback value
        this.addWidget(
            "number",
            "Default",
            this.properties.defaultValue,
            (v) => { this.properties.defaultValue = parseFloat(v) || 0; }
        );
    }

    static title = "Parse Number";
    static desc = "Parses a string/number to number";

    onExecute() {
        let input = this.getInputData(0);

        if (input === undefined || input === null) {
            input = this.properties.defaultValue;
        }

        const parsed = parseInt(input) || this.properties.defaultValue;
        this.setOutputData(0, parsed);
    }
}

