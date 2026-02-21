export default class MathNode {
    constructor() {
        // Inputs
        this.addInput("A", "number");
        this.addInput("B", "number");

        // Output
        this.addOutput("Result", "number");

        // Properties
        this.properties = {
            operator: "+" // default operator
        };
        this.size = [220, 80];

        // Operator dropdown widget
        this.addWidget(
            "combo",
            "Operator",
            this.properties.operator,
            (v) => { this.properties.operator = v; },
            { values: ["+", "-", "*", "/", "%", "^"] } // allowed operators
        );
    }

    static title = "Math";
    static desc = "Performs math operations on two numbers";

    onExecute() {
        let a = parseFloat(this.getInputData(0)) || 0;
        let b = parseFloat(this.getInputData(1)) || 0;
        let result;

        switch (this.properties.operator) {
            case "+": result = a + b; break;
            case "-": result = a - b; break;
            case "*": result = a * b; break;
            case "/": result = b !== 0 ? a / b : 0; break;
            case "%": result = b !== 0 ? a % b : 0; break;
            case "^": result = Math.pow(a, b); break;
            default: result = 0;
        }

        this.setOutputData(0, result);
    }
}
