export default class TextInputNode {
    constructor() {
        this.addOutput("text", "string");
        this.properties = { value: "" };
        this.size = [400, 100];

        // THIS creates the default litegraph inline text widget
        this.addWidget(
            "text",      // widget type
            "Text",      // label
            this.properties.value,  // initial value
            (v) => { this.properties.value = v; }  // update callback
        );
    }

    static title = "Text Input";
    static desc = "Inline text input node";

    onExecute() {
        this.setOutputData(0, this.properties.value);
    }
}