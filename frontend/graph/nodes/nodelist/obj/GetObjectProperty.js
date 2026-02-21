export default class GetObjectProperty {
    constructor() {
        this.addInput("object", "object");
        this.addOutput("text", 0);
        this.properties = { value: "" };
        this.size = [400, 100];

        // THIS creates the default litegraph inline text widget
        this.addWidget(
            "text",      // widget type
            "Property",      // label
            this.properties.value,  // initial value
            (v) => { this.properties.value = v; }  // update callback
        );
    }

    static title = "Get Object Property";
    static desc = "Inline text input node";

    onExecute() {
        // this.setOutputData(0, this.properties.value);
        const obj = this.getInputData(0);
        if (obj === undefined || obj === null) {
            this.setOutputData(0, null);
            return;
        }
        const value = obj[this.properties.value];
        this.setOutputData(0, value);
    }
}