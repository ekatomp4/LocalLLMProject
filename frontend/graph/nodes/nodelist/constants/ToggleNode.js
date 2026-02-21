class ToggleNode {
    constructor() {
        this.addInput("in", 0);
        this.addOutput("out", 0);
        this.properties = { enabled: true };
        this.size = [160, 60];

        this.addWidget("toggle", "enabled", this.properties.enabled, (v) => {
            this.properties.enabled = v;
        });
    }

    static title = "Toggle";
    static desc = "Passes input through when enabled, otherwise outputs null";

    onExecute() {
        const input = this.getInputData(0);
        this.setOutputData(0, this.properties.enabled ? input : null);
    }
}

export default ToggleNode;