import AsyncNode from "../../templates/AsyncNode.js";


class RunCommandNode extends AsyncNode {
    constructor() {
        super(async (prompt) => {

            const res = await fetch(`http://localhost:6555/api/cmd`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: prompt }),
            });

            if (!res.ok) throw new Error(`CMD error: ${res.status}`);
            const data = await res.json();
            return data;
        }, "string", "string");

        this.size = [220, 80];

    }

    static title = "CMD Call";
    static desc = "Sends a command to the server";
}

export default RunCommandNode;