export default class FormatBrokenJsonNode {
    constructor() {
        this.addInput("json", "string");
        this.addOutput("fixed", "string");
        this.addOutput("object", "object");
        this.addOutput("error", "string");

        this.properties = {};
        this.size = [240, 60];
        this._status = "";
        this._statusColor = "#888";
    }

    static title = "Fix Broken JSON";
    static desc = "Attempts to repair malformed JSON strings";

    _repair(str) {
        if (typeof str !== "string") str = String(str);

        let s = str.trim();

        // ── 1. Strip common LLM markdown fences ──────────────────────────
        s = s.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        s = s.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();

        // ── 2. Replace smart/curly quotes with straight quotes ────────────
        s = s
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');

        // ── 3. Replace single-quoted keys/values with double quotes ───────
        // Only replace single quotes that are acting as JSON delimiters
        s = s.replace(/'([^']*)'(\s*:)/g, '"$1"$2');  // keys
        s = s.replace(/:\s*'([^']*)'/g, ': "$1"');     // string values

        // ── 4. Add missing quotes around unquoted keys ────────────────────
        s = s.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

        // ── 5. Remove trailing commas before } or ] ───────────────────────
        s = s.replace(/,(\s*[}\]])/g, "$1");

        // ── 6. Try to detect if it's an object or array and fix wrapping ──
        const firstBrace = s.search(/[{[]/);
        const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));

        if (firstBrace === -1) {
            // No braces at all — try wrapping as object
            s = `{${s}}`;
        } else {
            // Trim anything before the first brace / bracket
            s = s.slice(firstBrace);
        }

        // ── 7. Balance braces and brackets ───────────────────────────────
        s = this._balanceBrackets(s);

        return s;
    }

    _balanceBrackets(s) {
        const opens = { "{": "}", "[": "]" };
        const closes = new Set(["}", "]"]);
        const stack = [];

        // Walk through and track opens
        let inString = false;
        let escape = false;
        for (let i = 0; i < s.length; i++) {
            const c = s[i];
            if (escape) { escape = false; continue; }
            if (c === "\\" && inString) { escape = true; continue; }
            if (c === '"') { inString = !inString; continue; }
            if (inString) continue;

            if (opens[c]) stack.push(opens[c]);
            else if (closes.has(c)) {
                if (stack.length && stack[stack.length - 1] === c) {
                    stack.pop();
                }
                // mismatched close — leave it, JSON.parse will catch it
            }
        }

        // Append any missing closing brackets in reverse order
        while (stack.length) {
            s += stack.pop();
        }

        return s;
    }

    onExecute() {
        const input = this.getInputData(0);
        if (input === undefined || input === null) return;

        // First try parsing as-is
        try {
            const parsed = JSON.parse(input);
            this.setOutputData(0, input);
            this.setOutputData(1, parsed);
            this.setOutputData(2, "");
            this._status = "valid";
            this._statusColor = "#44ff88";
            return;
        } catch (_) {
            // needs repair
        }

        // Attempt repair
        let repaired;
        try {
            repaired = this._repair(input);
            const parsed = JSON.parse(repaired);
            this.setOutputData(0, repaired);
            this.setOutputData(1, parsed);
            this.setOutputData(2, "");
            this._status = "repaired";
            this._statusColor = "#ffcc44";
        } catch (e) {
            // Repair failed — still output best attempt so user can see it
            this.setOutputData(0, repaired ?? input);
            this.setOutputData(1, null);
            this.setOutputData(2, e.message);
            this._status = "failed";
            this._statusColor = "#ff4444";
        }
    }

    onDrawBackground(ctx) {
        if (!this._status) return;
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
        ctx.fillStyle = this._statusColor;
        ctx.font = "12px monospace";
        ctx.fillText(`● ${this._status}`, 10, 20);
    }
}