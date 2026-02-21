class SelectNode {
    constructor() {
        this.addInput("input1", 0);
        this.addInput("input2", 0);
        this.addOutput("out", 0);
        this.properties = { selected: 1 };
        this.size = [180, 60];

        this.addWidget("combo", "selected", this.properties.selected,
            (v) => { this.properties.selected = v; },
            { values: [1, 2] }
        );
    }

    static title = "Select";
    static desc = "Passes input1 or input2 to output";

    onExecute() {
        const val = this.properties.selected === 1
            ? this.getInputData(0)
            : this.getInputData(1);
        this.setOutputData(0, val);
    }
}

export default SelectNode;