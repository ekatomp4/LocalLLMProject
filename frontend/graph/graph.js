import NodeList from "./nodes/NodeList.js";
import GraphManager from "./GraphManager.js";

LiteGraph.clearRegisteredTypes();
LiteGraph.NODE_TEXT_Y = 20;
LiteGraph.NODE_SLOT_HEIGHT = 20;
for (const [key, value] of Object.entries(NodeList)) {
    LiteGraph.registerNodeType(key, value);
}

window.graphColors = {
    partial: "#449caa",
    processing: "#4444aa",
    error: "#aa4444",
    default: "#222",
}

const graph = new window.LGraph();
const canvas = new LGraphCanvas("#graphcanvas", graph);
window.__lgCanvas = canvas;

canvas.onNodeRemoved = function(node) { node.onRemoved?.(); };
canvas.allow_searchbox = false;
canvas.config && (canvas.config.enableCanvasDoubleClick = false);
canvas.onShowNodePanel = () => {};
LGraphCanvas.prototype.processNodeDblClicked = function() {};

// ===== SAVE / LOAD =====
function saveGraph() {
    const json = JSON.stringify(graph.serialize());
    localStorage.setItem("lgraph_save", json);
}

function loadGraph() {
    const json = localStorage.getItem("lgraph_save");
    if (!json) return false;
    graph.configure(JSON.parse(json));
    return true;
}

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveGraph(); }
    if (e.key.toLowerCase() === "l" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); loadGraph(); }
}, true);

window.saveGraph = saveGraph;
window.loadGraph = loadGraph;

// ===== DEFAULT NODES (only if no save exists) =====
const hasSave = loadGraph();
if (!hasSave) {
    const textNode = LiteGraph.createNode("custom/text/input/text_input");
    textNode.properties.value = "http://localhost:6555/api/ping";
    textNode.widgets[0].value = "http://localhost:6555/api/ping";
    textNode.pos = [100, 200];
    graph.add(textNode);

    const fetchNode = LiteGraph.createNode("custom/async/fetch_text");
    fetchNode.pos = [350, 200];
    graph.add(fetchNode);

    const outputNode = LiteGraph.createNode("custom/text/output/text_output");
    outputNode.pos = [600, 200];
    graph.add(outputNode);

    textNode.connect(0, fetchNode, 0);
    fetchNode.connect(0, outputNode, 0);
}

// ===== START GRAPH =====
graph.start(1000);

// Auto-save every 5 seconds
setInterval(saveGraph, 5000);

// ===== RESIZE HANDLER =====
function resizeGraph() {
    const rect = canvas.canvas.parentElement.getBoundingClientRect();
    canvas.resize(rect.width, rect.height);
}
window.addEventListener("resize", resizeGraph);
resizeGraph();

// ===== GRAPH MANAGER =====
const manager = new GraphManager(graph);

// ===== BUILD CONTEXT MENU FROM NODELIST =====
function buildMenuTree(nodeList) {
    const tree = {};
    for (const key of Object.keys(nodeList)) {
        const segments = key.split("/").slice(1);
        let node = tree;
        for (let i = 0; i < segments.length - 1; i++) {
            node[segments[i]] = node[segments[i]] || {};
            node = node[segments[i]];
        }
        node[segments[segments.length - 1]] = key;
    }
    return tree;
}

function formatLabel(str) {
    return str.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function buildMenuEl(tree, depth = 0) {
    const menu = document.createElement("div");
    menu.className = "graphContextMenu";
    if (depth === 0) menu.id = "graphContextMenu";

    for (const [key, value] of Object.entries(tree)) {
        if (typeof value === "string") {
            const btn = document.createElement("button");
            btn.dataset.type = value;
            btn.textContent = formatLabel(key);
            menu.appendChild(btn);
        } else {
            const item = document.createElement("div");
            item.className = "graphContextMenuItem folder";

            const label = document.createElement("span");
            label.textContent = formatLabel(key);
            item.appendChild(label);

            const arrow = document.createElement("span");
            arrow.textContent = "▶";
            arrow.className = "folder-arrow";
            item.appendChild(arrow);

            const sub = buildMenuEl(value, depth + 1);
            sub.className = "graphContextMenu submenu";
            item.appendChild(sub);

            item.addEventListener("mouseenter", () => sub.style.display = "block");
            item.addEventListener("mouseleave", () => sub.style.display = "none");

            menu.appendChild(item);
        }
    }

    return menu;
}

const menuTree = buildMenuTree(NodeList);
const contextMenu = buildMenuEl(menuTree);
contextMenu.style.display = "none";
document.getElementById("main").appendChild(contextMenu);

canvas.canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();

    const mainRect = canvas.canvas.getBoundingClientRect();
    const menuWidth = contextMenu.offsetWidth || 160;
    const menuHeight = contextMenu.offsetHeight || 200;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    contextMenu.style.left = `${x - mainRect.left}px`;
    contextMenu.style.top  = `${y - mainRect.top}px`;
    contextMenu.style.display = "block";

    const graphPos = canvas.convertEventToCanvasOffset(e);
    contextMenu.dataset.x = graphPos[0];
    contextMenu.dataset.y = graphPos[1];
});

document.addEventListener("click", () => {
    contextMenu.style.display = "none";
});

contextMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const fullType = btn.dataset.type;
    const x = parseFloat(contextMenu.dataset.x);
    const y = parseFloat(contextMenu.dataset.y);
    manager.addNode(fullType, {}, [x, y]);
    contextMenu.style.display = "none";
});