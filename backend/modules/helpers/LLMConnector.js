const OLLAMA_URL = process.env.OLLAMA_HOST ?? "http://localhost:11434";

const BEST_FIT_MODELS = {
    "small": "gemma3:1b",
    "medium": "dolphin3:latest",
    "embedding": "qwen3-embedding:4b",
}

// ===== LLMOptions ==========================================================
export class LLMOptions {
    constructor({
        // Sampling
        temperature      = 0.7,
        topP             = 0.9,
        topK             = 40,
        minP             = 0.0,

        // Context & output
        numCtx           = 4096,
        numPredict       = -1,

        // Repetition
        repeatPenalty    = 1.1,
        repeatLastN      = 64,
        presencePenalty  = 0.0,
        frequencyPenalty = 0.0,

        // Performance
        numGpu           = -1,
        numThread        = null,
        useMmap          = true,
        useMlock         = false,
        lowVram          = false,

        // Misc
        seed             = -1,
        stop             = [],
        tfsZ             = 1.0,
        typicalP         = 1.0,
        mirostat         = 0,
        mirostatTau      = 5.0,
        mirostatEta      = 0.1,

        // Memory
        keepAlive        = "5m",

        // Format — "json" forces JSON output, null = default text
        // This is equivalent to /set format json in the CLI
        format           = null,
    } = {}) {
        this.temperature       = temperature;
        this.top_p             = topP;
        this.top_k             = topK;
        this.min_p             = minP;
        this.num_ctx           = numCtx;
        this.num_predict       = numPredict;
        this.repeat_penalty    = repeatPenalty;
        this.repeat_last_n     = repeatLastN;
        this.presence_penalty  = presencePenalty;
        this.frequency_penalty = frequencyPenalty;
        this.num_gpu           = numGpu;
        this.num_thread        = numThread;
        this.use_mmap          = useMmap;
        this.use_mlock         = useMlock;
        this.low_vram          = lowVram;
        this.seed              = seed;
        this.stop              = stop;
        this.tfs_z             = tfsZ;
        this.typical_p         = typicalP;
        this.mirostat          = mirostat;
        this.mirostat_tau      = mirostatTau;
        this.mirostat_eta      = mirostatEta;
        this.keepAlive         = keepAlive;
        this.format            = format;
    }

    toRequestOptions() {
        const { keepAlive, format, ...rest } = this;
        return Object.fromEntries(
            Object.entries(rest).filter(([, v]) => v !== null)
        );
    }
}


// ===== LLMConnector =========================================================
export class LLMConnector {
    /**
     * @param {string} model
     * @param {LLMOptions|object} options
     */
    constructor(model = BEST_FIT_MODELS.small, options = new LLMOptions()) {
        this.model   = model;
        this.options = options instanceof LLMOptions ? options : new LLMOptions(options);

        // Pinned messages — always first in every request, never trimmed
        // { id, role, content, enabled }
        this._pinned = [];

        // Conversation history — can be trimmed, entries can be toggled
        // { id, role, content, enabled }
        this.history = [];

        this._idCounter = 0;
    }

    // ── ID generation ──────────────────────────────────────────────────────
    _nextId() {
        return `msg_${++this._idCounter}`;
    }

    // ── Internal: build fetch body ─────────────────────────────────────────
    _buildBody(messages, { format, stream = false } = {}) {
        // Per-call format overrides options-level format, which overrides nothing
        const resolvedFormat = format ?? this.options.format ?? null;

        const body = {
            model:      this.model,
            messages,
            stream,
            options:    this.options.toRequestOptions(),
            keep_alive: this.options.keepAlive,
        };

        if (resolvedFormat === "json") body.format = "json";
        if (this.options.stop?.length) body.options.stop = this.options.stop;

        return body;
    }

    // ── Internal: stream reader ────────────────────────────────────────────
    async _readStream(res, { onChunk, onDone } = {}) {
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split("\n").filter(Boolean);
            for (const line of lines) {
                try {
                    const json  = JSON.parse(line);
                    const token = json.message?.content ?? "";
                    fullReply  += token;
                    onChunk?.(token, fullReply);
                    if (json.done) onDone?.(fullReply);
                } catch {
                    // malformed chunk, skip
                }
            }
        }

        return fullReply;
    }

    // ── Internal: build messages array ─────────────────────────────────────
    // Order: pinned (enabled only) → history (enabled only) → new user message
    _buildMessages(userMessage, { systemPrompt, includeHistory = false } = {}) {
        const messages = [];

        // Optional per-call system prompt goes before pinned
        if (systemPrompt) messages.push({ role: "system", content: systemPrompt });

        // Pinned messages — always included if enabled, never trimmed
        for (const m of this._pinned) {
            if (m.enabled) messages.push({ role: m.role, content: m.content });
        }

        // History — only if requested, only enabled entries
        if (includeHistory) {
            for (const m of this.history) {
                if (m.enabled) messages.push({ role: m.role, content: m.content });
            }
        }

        messages.push({ role: "user", content: userMessage });
        return messages;
    }

    // ── Internal: append to history ────────────────────────────────────────
    _appendHistory(userMessage, reply) {
        this.history.push({ id: this._nextId(), role: "user",      content: userMessage, enabled: true });
        this.history.push({ id: this._nextId(), role: "assistant", content: reply,       enabled: true });
    }

    // ===== PINNED MESSAGES ==================================================

    /**
     * Add a pinned message. Returns its id.
     * Pinned messages are always sent first and never trimmed.
     * Use for: system context, personas, fixed examples.
     *
     * @param {"system"|"user"|"assistant"} role
     * @param {string} content
     * @param {boolean} enabled
     * @returns {string} id
     */
    addPinned(role, content, enabled = true) {
        const id = this._nextId();
        this._pinned.push({ id, role, content, enabled });
        return id;
    }

    /**
     * Load an array of messages as pinned entries.
     * Accepts raw { role, content } objects or saved { id, role, content, enabled }.
     * Useful for loading a saved persona or reference conversation.
     *
     * @param {Array} messages
     * @param {boolean} defaultEnabled - enabled state for entries that don't specify it
     */
    loadPinned(messages, defaultEnabled = true) {
        for (const msg of messages) {
            this._pinned.push({
                id:      msg.id ?? this._nextId(),
                role:    msg.role,
                content: msg.content,
                enabled: msg.enabled ?? defaultEnabled,
            });
        }
    }

    /** Toggle a pinned message on/off without deleting it */
    setPinnedEnabled(id, enabled) {
        const msg = this._pinned.find(m => m.id === id);
        if (msg) msg.enabled = enabled;
    }

    removePinned(id) {
        this._pinned = this._pinned.filter(m => m.id !== id);
    }

    clearPinned() {
        this._pinned = [];
    }

    getPinned() {
        return [...this._pinned];
    }

    // ===== HISTORY ==========================================================

    /**
     * Load old history entries. Accepts raw or saved format.
     * Loaded entries can be individually toggled on/off.
     *
     * @param {Array} messages
     * @param {boolean} defaultEnabled
     */
    loadHistory(messages, defaultEnabled = true) {
        for (const msg of messages) {
            this.history.push({
                id:      msg.id ?? this._nextId(),
                role:    msg.role,
                content: msg.content,
                enabled: msg.enabled ?? defaultEnabled,
            });
        }
    }

    /** Toggle a history entry on/off — disabled entries are skipped in requests */
    setHistoryEnabled(id, enabled) {
        const msg = this.history.find(m => m.id === id);
        if (msg) msg.enabled = enabled;
    }

    /** Enable/disable a range of history entries by index */
    setHistoryRangeEnabled(fromIndex, toIndex, enabled) {
        for (let i = fromIndex; i <= toIndex && i < this.history.length; i++) {
            this.history[i].enabled = enabled;
        }
    }

    /**
     * Trim history to last N exchanges (user+assistant pairs).
     * Only trims the history array — pinned messages are never touched.
     */
    trimHistory(maxExchanges = 10) {
        const maxMessages = maxExchanges * 2;
        if (this.history.length > maxMessages) {
            this.history = this.history.slice(-maxMessages);
        }
    }

    clearHistory() {
        this.history = [];
    }

    /** Export full history as plain { role, content } array for saving */
    exportHistory() {
        return this.history.map(({ role, content, id, enabled }) => ({ id, role, content, enabled }));
    }

    /** Export pinned as plain array for saving */
    exportPinned() {
        return this._pinned.map(({ role, content, id, enabled }) => ({ id, role, content, enabled }));
    }

    // ===== REINFORCEMENT ====================================================
    //
    // NOTE: This adjusts *sampling parameters*, not model weights.
    // Real RL requires retraining — this is "steering" not "learning".
    // It will help steer toward or away from the current output style
    // but has diminishing returns over many calls. Values are clamped
    // so they can't drift into unusable ranges.
    //
    // responseLevel: -1 = bad, 0 = neutral, 1 = good

    reinforce(responseLevel) {

        if (responseLevel === 1) {
            // Good — make it more consistent, less random
            // this.options.temperature   = Math.max(0.1,  this.options.temperature   - step);
            this.options.repeat_penalty = Math.min(1.5, this.options.repeat_penalty + 0.02);
        } else if (responseLevel === -1) {
            // Bad — explore more, increase variety
            // this.options.temperature   = Math.min(1.5,  this.options.temperature   + step);
            this.options.top_p         = Math.min(1.0,  this.options.top_p         + 0.02);
            this.options.repeat_penalty = Math.max(1.0, this.options.repeat_penalty - 0.02);
        }
        // 0 = neutral, no change

        console.log(`[reinforce] level=${responseLevel} temp=${this.options.temperature.toFixed(3)} repeatPenalty=${this.options.repeat_penalty.toFixed(3)}`);
        
        return this.options;
    }

    // ===== COMPLETION METHODS ===============================================

    async complete(prompt, { format, systemPrompt } = {}) {
        const messages = this._buildMessages(prompt, { systemPrompt });
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(this._buildBody(messages, { format })),
        });
        if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        return data.message.content;
    }

    async completeStream(prompt, { onChunk, onDone, format, systemPrompt } = {}) {
        const messages = this._buildMessages(prompt, { systemPrompt });
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(this._buildBody(messages, { format, stream: true })),
        });
        if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
        return this._readStream(res, { onChunk, onDone });
    }

    async chat(userMessage, { format, systemPrompt } = {}) {
        const messages = this._buildMessages(userMessage, { systemPrompt, includeHistory: true });
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(this._buildBody(messages, { format })),
        });
        if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
        const data  = await res.json();
        const reply = data.message.content;
        this._appendHistory(userMessage, reply);
        return reply;
    }

    async chatStream(userMessage, { onChunk, onDone, format, systemPrompt } = {}) {
        const messages = this._buildMessages(userMessage, { systemPrompt, includeHistory: true });
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(this._buildBody(messages, { format, stream: true })),
        });
        if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);

        return this._readStream(res, {
            onChunk,
            onDone: (full) => {
                this._appendHistory(userMessage, full);
                onDone?.(full);
            }
        });
    }

    // ===== MODEL & OPTIONS ==================================================

    async isRunning() {
        try {
            const res = await fetch(`${OLLAMA_URL}/api/tags`);
            return res.ok;
        } catch {
            return false;
        }
    }

    async getModels() {
        try {
            const res  = await fetch(`${OLLAMA_URL}/api/tags`);
            const data = await res.json();
            return data.models.map(m => ({
                name:     m.name,
                id:       m.digest.slice(0, 12),
                size:     m.size,
                modified: m.modified_at,
            }));
        } catch {
            return [];
        }
    }

    setModel(model) {
        this.model = model;
    }

    setOptions(options = {}) {
        this.options = new LLMOptions({ ...this.options, ...options });
    }

    /** Shorthand for enabling/disabling JSON format globally, like /set format json in CLI */
    setFormat(format) {
        this.options.format = format; // "json" or null to disable
    }

    // clean all emojis from chunk or message
    cleanRes(messageOrChunk) {
        return messageOrChunk
            .replace(/[\p{Emoji}\p{Extended_Pictographic}]/gu, '')  // base emoji
            .replace(/\p{Emoji_Modifier}/gu, '')                     // skin tones
            .replace(/\uFE0F/g, '')                                  // variation selector-16
            .replace(/\u200D/g, '')                                  // zero-width joiner
            .replace(/[\uD83C][\uDDE0-\uDDFF]/g, '')                // flag sequences
            .trim();
    }
}

export default LLMConnector;

/*
async chatWithMemory(userMessage, memoryStore, topK = 3) {
    const relevant = await memoryStore.search(userMessage, topK);
    const context  = relevant.map(m => m.text).join("\n");
    const systemPrompt = `Relevant context:\n${context}`;
    const reply = await this.chat(userMessage, { systemPrompt });
    await memoryStore.add(`User: ${userMessage}\nAssistant: ${reply}`);
    return reply;
}
*/