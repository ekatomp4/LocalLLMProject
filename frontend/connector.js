// ================================
// Connector — WebSocket + Requests
// ================================

class Connector {
  constructor(options = {}) {
    this.httpBase = options.httpBase ?? window.location.origin;
    this.wsUrl =
      options.wsUrl ??
      `ws://${window.location.hostname}:${options.wsPort ?? 8080}`;

    this.ws = null;
    this.isConnected = false;

    // bind handlers
    this._handleOpen = this._handleOpen.bind(this);
    this._handleMessage = this._handleMessage.bind(this);
    this._handleClose = this._handleClose.bind(this);
    this._handleError = this._handleError.bind(this);
  }

  // ================================
  // WebSocket
  // ================================

  connect() {
    if (this.ws) return;

    this.ws = new WebSocket(this.wsUrl);

    this.ws.addEventListener('open', this._handleOpen);
    this.ws.addEventListener('message', this._handleMessage);
    this.ws.addEventListener('close', this._handleClose);
    this.ws.addEventListener('error', this._handleError);
  }

  disconnect() {
    if (!this.ws) return;
    this.ws.close();
    this.ws = null;
    this.isConnected = false;
  }

  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    const packet = {
      type,
      payload,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(packet));
  }

  // ================================
  // HTTP Requests
  // ================================

  async get(path) {
    const res = await fetch(`${this.httpBase}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    return this._handleHttpResponse(res);
  }

  async post(path, body = {}) {
    const res = await fetch(`${this.httpBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return this._handleHttpResponse(res);
  }

  async _handleHttpResponse(res) {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      return res.json();
    }

    return res.text();
  }

  // ================================
  // Internal WS Handlers
  // ================================

  _handleOpen() {
    this.isConnected = true;
    console.log('[WS] Connected');
  }

  _handleMessage(event) {
    let data = event.data;

    try {
      data = JSON.parse(event.data);
    } catch {
      // leave as raw text
    }

    console.log('[WS] Message:', data);
  }

  _handleClose() {
    this.isConnected = false;
    console.log('[WS] Disconnected');
  }

  _handleError(err) {
    console.error('[WS] Error:', err);
  }
}

// ================================
// Singleton export (clean usage)
// ================================

const connector = new Connector({
  wsPort: 6556
});

connector.connect();

export default connector;
