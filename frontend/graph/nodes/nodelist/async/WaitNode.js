import AsyncNode from "../../templates/AsyncNode.js";

class WaitNode extends AsyncNode {
    constructor() {
        super(async (input) => {
            const ms = this.properties.ms ?? 1000;
            await new Promise(resolve => setTimeout(resolve, ms));
            return input;
        }, "string", "string");

        this.properties = { ms: 1000 };
        this.size = [220, 80];

        this.addWidget("number", "delay (ms)", 1000, (v) => {
            this.properties.ms = v;
        });
    }

    static title = "Wait";
    static desc = "Waits for a given number of milliseconds, then passes input through";
}

export default WaitNode;