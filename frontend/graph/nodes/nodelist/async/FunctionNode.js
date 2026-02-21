import AsyncNode from "../../templates/AsyncNode.js";


class FunctionNode extends AsyncNode {
    constructor() {
        super(async (prompt) => {
            // Eval input string and set output to result
            try {
                const asyncFunction = new Function(`return (async () => { ${prompt} })()`);
                return await asyncFunction();
            } catch (err) {
                console.error(err);
                return `Error executing function: ${err.message}`;
            }
        }, "string", "string");

        this.properties = { format: "text" };
        this.size = [220, 80];
    }

    static title = "Function Call";
    static desc = "Calls a function and returns the response";
}

export default FunctionNode;