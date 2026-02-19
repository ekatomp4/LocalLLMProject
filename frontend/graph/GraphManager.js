// ===== GLOBAL REMOVAL PATCH =====
// Patch LGraph.prototype.remove so onRemoved is ALWAYS called
// regardless of whether deletion comes from the UI, keyboard, or code
const _originalRemove = LGraph.prototype.remove;
LGraph.prototype.remove = function(node) {
    console.log("Removing node", node);
    node?.onRemoved?.();
    _originalRemove.call(this, node);

    // clean class = graphdialog
    const dialogs = document.getElementsByClassName("graphdialog");
    for (const dialog of dialogs) {
        dialog.remove();
    }
};

class GraphManager {
    constructor(graph) {
        this.graph = graph;
        this.nodes = new Map();
    }

    addNode(type, props = {}, pos = [100, 100], id = null) {
        const node = LiteGraph.createNode(type);
        if (!node) {
            console.error(`Node type '${type}' is not registered`);
            return null;
        }

        for (const [key, value] of Object.entries(props)) {
            if (node.properties && key in node.properties) {
                node.properties[key] = value;
            }
            const widget = node.widgets?.find(w => w.name.toLowerCase() === key.toLowerCase());
            if (widget) widget.value = value;
        }

        node.pos = [...pos];
        this.graph.add(node);

        const nodeId = id || node.id;
        this.nodes.set(nodeId, node);

        return node;
    }

    deleteNode(id) {
        const node = this.nodes.get(id);
        if (!node) return false;

        node.inputs?.forEach(input => {
            if (input.link != null) this.graph.links[input.link] && node.disconnectInput(node.inputs.indexOf(input));
        });

        node.outputs?.forEach(output => {
            output.links?.slice().forEach(() => node.disconnectOutput(node.outputs.indexOf(output)));
        });

        this.graph.remove(node); // onRemoved will be called via the patch above
        this.nodes.delete(id);

        return true;
    }

    connectNodes(outputNodeId, outputSlot, inputNodeId, inputSlot) {
        const outNode = this.nodes.get(outputNodeId);
        const inNode = this.nodes.get(inputNodeId);
        if (!outNode || !inNode) {
            console.error(`connectNodes: could not find nodes ${outputNodeId} or ${inputNodeId}`);
            return false;
        }
        return outNode.connect(outputSlot, inNode, inputSlot);
    }

    getNode(id) {
        return this.nodes.get(id) || null;
    }

    clear() {
        // Call onRemoved on all nodes before clearing
        for (const node of this.nodes.values()) {
            node?.onRemoved?.();
        }
        this.nodes.clear();
        this.graph.clear();
    }
}

export default GraphManager;