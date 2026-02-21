// ── Minimal self-contained markdown parser ────────────────────────────────
function parseMarkdown(md) {
    if (!md) return "";

    let html = md
        // Escape HTML entities first
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Fenced code blocks ```lang\n...\n```
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headings
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm,  "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm,   "<h1>$1</h1>");

    // Horizontal rule
    html = html.replace(/^---+$/gm, "<hr>");

    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

    // Bold + italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g,     "<strong>$1</strong>");
    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.+?)_/g,   "<em>$1</em>");

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // Unordered list items
    html = html.replace(/^\s*[-*+] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>");

    // Ordered list items
    html = html.replace(/^\s*\d+\. (.+)$/gm, "<li>$1</li>");

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Paragraphs — wrap lines not already wrapped in a block tag
    html = html.split("\n").map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr)/.test(trimmed)) return line;
        return `<p>${line}</p>`;
    }).join("\n");

    return html;
}


// ── Styles (injected once) ─────────────────────────────────────────────────
function injectStyles() {
    if (document.getElementById("md-output-styles")) return;
    const style = document.createElement("style");
    style.id = "md-output-styles";
    style.textContent = `
        .md-output-node {
            position: fixed;
            background: #1a1a1a;
            color: #cccccc;
            border: 1px solid #444;
            padding: 10px 14px;
            box-sizing: border-box;
            overflow-y: auto;
            overflow-x: hidden;
            z-index: 10;
            pointer-events: auto;
            line-height: 1.6;
            font-family: system-ui, sans-serif;
            font-size: 13px;
        }
        .md-output-node h1, .md-output-node h2, .md-output-node h3 {
            color: #ffffff;
            margin: 8px 0 4px;
            font-weight: 600;
            line-height: 1.3;
        }
        .md-output-node h1 { font-size: 1.3em; border-bottom: 1px solid #333; padding-bottom: 4px; }
        .md-output-node h2 { font-size: 1.15em; }
        .md-output-node h3 { font-size: 1.0em; color: #ddd; }
        .md-output-node p  { margin: 4px 0; }
        .md-output-node code {
            background: #2a2a2a;
            color: #88ccff;
            padding: 1px 5px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.85em;
        }
        .md-output-node pre {
            background: #111;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 10px;
            overflow-x: auto;
            margin: 6px 0;
        }
        .md-output-node pre code {
            background: none;
            padding: 0;
            color: #aaffaa;
            font-size: 0.82em;
        }
        .md-output-node ul, .md-output-node ol {
            margin: 4px 0;
            padding-left: 20px;
        }
        .md-output-node li { margin: 2px 0; }
        .md-output-node blockquote {
            border-left: 3px solid #555;
            margin: 6px 0;
            padding: 2px 10px;
            color: #aaa;
            font-style: italic;
        }
        .md-output-node a    { color: #88aaff; text-decoration: none; }
        .md-output-node a:hover { text-decoration: underline; }
        .md-output-node hr   { border: none; border-top: 1px solid #333; margin: 8px 0; }
        .md-output-node strong { color: #fff; }
        .md-output-node em   { color: #ffddaa; font-style: italic; }
        .md-output-node del  { color: #888; text-decoration: line-through; }
    `;
    document.head.appendChild(style);
}


// ── Node ───────────────────────────────────────────────────────────────────
export default class MDOutputNode {
    constructor() {
        this.addInput("text", 0);
        this.addOutput("text", "string");
        this.properties = { value: "" };
        this.size = [400, 200];
        this._div = null;
    }

    static title = "Markdown Output";
    static desc  = "Renders markdown as formatted HTML, fully local";

    onExecute() {
        const input = this.getInputData(0);
        if (input !== undefined && input !== null) {
            this.properties.value = String(input);
        }
        this._syncDiv();
        this.setOutputData(0, this.properties.value);
    }

    _createDiv() {
        injectStyles();
        const div = document.createElement("div");
        div.className = "multiline-text";
        document.querySelector("#main").appendChild(div);
        this._div = div;
    }

    _syncDiv() {
        if (!this._div) return;

        const lg       = window.__lgCanvas;
        const canvasEl = document.querySelector("#graphcanvas");
        const rect     = canvasEl.getBoundingClientRect();
        const ds       = lg.ds ?? {};
        const scale    = ds.scale ?? 1;
        const offset   = ds.offset ?? [0, 0];

        const x      = rect.left + (this.pos[0] + offset[0]) * scale;
        const y      = rect.top  + (this.pos[1] + offset[1]) * scale;
        const w      = this.size[0] * scale;
        const h      = this.size[1] * scale;
        const titleH = 20 * scale;

        this._div.style.left     = `${x}px`;
        this._div.style.top      = `${y + titleH}px`;
        this._div.style.width    = `${w}px`;
        this._div.style.height   = `${h}px`;
        this._div.style.fontSize = `${Math.max(10, 12 * scale)}px`;
        this._div.innerHTML      = parseMarkdown(this.properties.value);
    }

    onDrawBackground(ctx) {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.size[0], this.size[1]);

        if (!this._div) this._createDiv();
        this._syncDiv();
    }

    onRemoved() {
        if (this._div) {
            this._div.remove();
            this._div = null;
        }
    }
}