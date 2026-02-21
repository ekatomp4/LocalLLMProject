export default class TextToSpeechNode {
    constructor() {
        this.addInput("text", "string");
        this.addInput("trigger", "boolean"); // optional — only speak on true pulse

        this.properties = {
            voice:  "",    // voice name, empty = default
            rate:   1.0,   // 0.1 - 10
            pitch:  1.0,   // 0 - 2
            volume: 1.0,   // 0 - 1
            autoPlay: true // speak whenever input changes
        };
        this.size = [260, 100];

        this._lastText    = "";
        this._speaking    = false;
        this._voices      = [];
        this._utterance   = null;

        // Load available voices (async in some browsers)
        this._loadVoices();
        if (typeof speechSynthesis !== "undefined") {
            speechSynthesis.onvoiceschanged = () => this._loadVoices();
        }

        this.addWidget("number", "Rate",   this.properties.rate,   (v) => { this.properties.rate   = parseFloat(v); });
        this.addWidget("number", "Pitch",  this.properties.pitch,  (v) => { this.properties.pitch  = parseFloat(v); });
        this.addWidget("number", "Volume", this.properties.volume, (v) => { this.properties.volume = parseFloat(v); });
        this.addWidget("toggle", "Auto Play", this.properties.autoPlay, (v) => { this.properties.autoPlay = v; });
    }

    static title = "Text to Speech";
    static desc  = "Speaks incoming text using the browser's speech synthesis";

    _loadVoices() {
        if (typeof speechSynthesis === "undefined") return;
        this._voices = speechSynthesis.getVoices();
    }

    speak(text) {
        if (!text || typeof speechSynthesis === "undefined") return;

        // Cancel any current speech
        speechSynthesis.cancel();

        const utterance      = new SpeechSynthesisUtterance(text);
        utterance.rate       = Math.max(0.1, Math.min(10, this.properties.rate));
        utterance.pitch      = Math.max(0,   Math.min(2,  this.properties.pitch));
        utterance.volume     = Math.max(0,   Math.min(1,  this.properties.volume));

        // Try to match saved voice name
        if (this.properties.voice) {
            const match = this._voices.find(v => v.name === this.properties.voice);
            if (match) utterance.voice = match;
        }

        utterance.onstart = () => { this._speaking = true; };
        utterance.onend   = () => { this._speaking = false; };
        utterance.onerror = () => { this._speaking = false; };

        this._utterance = utterance;
        speechSynthesis.speak(utterance);
    }

    stop() {
        if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
        this._speaking = false;
    }

    onExecute() {
        const text    = this.getInputData(0);
        const trigger = this.getInputData(1);

        if (!text) return;

        const triggerConnected = this.inputs[1]?.link != null;

        if (triggerConnected) {
            // Only speak when trigger pulses true
            if (trigger === true && text !== this._lastSpoken) {
                this._lastSpoken = text;
                this.speak(text);
            }
        } else if (this.properties.autoPlay && text !== this._lastSpoken) {
            // Auto speak whenever text changes
            this._lastSpoken = text;
            this.speak(text);
        }
    }

    onDrawBackground(ctx) {
        ctx.fillStyle = this._speaking ? "#225522" : "#222";
        ctx.fillRect(0, 0, this.size[0], this.size[1]);

        ctx.strokeStyle = this._speaking ? "#44aa44" : "#444";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.size[0], this.size[1]);

        ctx.fillStyle = "#fff";
        ctx.font      = "12px monospace";
        ctx.fillText(this._speaking ? "🔊 Speaking..." : "🔇 Idle", 8, 20);

        // Show available voice count
        ctx.fillStyle = "#888";
        ctx.font      = "10px monospace";
        ctx.fillText(`${this._voices.length} voices available`, 8, this.size[1] - 8);
    }

    onRemoved() {
        this.stop();
    }
}