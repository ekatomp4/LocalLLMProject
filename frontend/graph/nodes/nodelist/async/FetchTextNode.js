import AsyncNode from "../../templates/AsyncNode.js";

class FetchTextNode extends AsyncNode {
    constructor() {
        super(async (url) => {
            try {
                const res = await fetch(url);
                return await res.text();
            } catch (err) {
                console.error(err);
                return `Error fetching URL (${url}): ${err.code || err.message}`;
            }
        }, "string", "string");
    }

    static title = "Fetch Text";
    static desc = "Fetches text from a URL";
}

export default FetchTextNode;