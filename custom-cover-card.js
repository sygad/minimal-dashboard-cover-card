/**
 * Custom Cover Card for Home Assistant
 * A Lovelace card for controlling cover entities (blinds, shades, garage doors, ...).
 */

const CARD_VERSION = "0.1.0";

console.info(
  `%c CUSTOM-COVER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #03a9f4; font-weight: 700;",
  "color: #03a9f4; background: white; font-weight: 700;"
);

// Cover feature flags (from homeassistant/components/cover/__init__.py)
const SUPPORT_OPEN = 1;
const SUPPORT_CLOSE = 2;
const SUPPORT_SET_POSITION = 4;
const SUPPORT_STOP = 8;

const STYLES = `
  ha-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    box-sizing: border-box;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }
  .icon {
    color: var(--state-icon-color, var(--paper-item-icon-color));
  }
  .icon.active {
    color: var(--state-cover-active-color, var(--state-active-color, #ffc107));
  }
  .name {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .state {
    font-size: 14px;
    color: var(--secondary-text-color);
  }
  .body {
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 16px;
  }
  .window {
    position: relative;
    width: 72px;
    height: 88px;
    border: 3px solid var(--divider-color, #ccc);
    border-radius: 6px;
    background: linear-gradient(180deg, #8ecae6 0%, #cdeffd 100%);
    overflow: hidden;
  }
  .blind {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: repeating-linear-gradient(
      180deg,
      var(--secondary-background-color, #e0e0e0) 0px,
      var(--secondary-background-color, #e0e0e0) 6px,
      var(--divider-color, #bdbdbd) 6px,
      var(--divider-color, #bdbdbd) 8px
    );
    border-bottom: 3px solid var(--primary-color);
    transition: height 0.4s ease;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .btn:hover:not([disabled]) {
    background: var(--primary-color);
    color: var(--text-primary-color, white);
  }
  .btn[disabled] {
    opacity: 0.35;
    cursor: default;
  }
  .slider {
    width: 100%;
    accent-color: var(--primary-color);
    cursor: pointer;
  }
  .hidden {
    display: none !important;
  }
`;

class CustomCoverCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // ---- Lovelace API ----------------------------------------------------

  static getConfigElement() {
    return document.createElement("custom-cover-card-editor");
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass.states).find((id) => id.startsWith("cover.")) || "";
    return { entity };
  }

  setConfig(config) {
    if (!config.entity || !config.entity.startsWith("cover.")) {
      throw new Error("Please set a cover entity, e.g. entity: cover.living_room_blind");
    }
    this._config = { show_graphic: true, show_slider: true, ...config };
    this._built = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, rows: 3, min_columns: 4, min_rows: 2 };
  }

  // ---- Rendering -------------------------------------------------------

  _build() {
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <ha-card>
        <div class="header">
          <ha-icon class="icon"></ha-icon>
          <div>
            <div class="name"></div>
            <div class="state"></div>
          </div>
        </div>
        <div class="body">
          <div class="window"><div class="blind"></div></div>
          <div class="controls">
            <button class="btn" data-action="open_cover" title="Open">
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </button>
            <button class="btn" data-action="stop_cover" title="Stop">
              <ha-icon icon="mdi:stop"></ha-icon>
            </button>
            <button class="btn" data-action="close_cover" title="Close">
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </button>
          </div>
        </div>
        <input class="slider" type="range" min="0" max="100" step="1" aria-label="Position" />
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll(".btn").forEach((btn) =>
      btn.addEventListener("click", () => this._callService(btn.dataset.action))
    );

    const slider = this.shadowRoot.querySelector(".slider");
    slider.addEventListener("input", () => {
      this._dragging = true;
      this._showPosition(Number(slider.value));
    });
    slider.addEventListener("change", () => {
      this._dragging = false;
      this._callService("set_cover_position", { position: Number(slider.value) });
    });

    this.shadowRoot.querySelector(".header").addEventListener("click", () => this._openMoreInfo());

    this._built = true;
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._build();

    const root = this.shadowRoot;
    const stateObj = this._hass.states[this._config.entity];

    if (!stateObj) {
      root.querySelector(".name").textContent = this._config.entity;
      root.querySelector(".state").textContent = "Entity not found";
      root.querySelector(".body").classList.add("hidden");
      root.querySelector(".slider").classList.add("hidden");
      return;
    }

    const state = stateObj.state;
    const features = stateObj.attributes.supported_features || 0;
    const position = stateObj.attributes.current_position;
    const hasPosition = typeof position === "number";
    const unavailable = state === "unavailable" || state === "unknown";

    // Header
    root.querySelector(".name").textContent =
      this._config.name || stateObj.attributes.friendly_name || this._config.entity;
    const formatted = this._hass.formatEntityState ? this._hass.formatEntityState(stateObj) : state;
    root.querySelector(".state").textContent =
      hasPosition && !unavailable ? `${formatted} · ${position}%` : formatted;

    const icon = root.querySelector(".icon");
    icon.setAttribute("icon", this._config.icon || (state === "closed" ? "mdi:window-shutter" : "mdi:window-shutter-open"));
    icon.classList.toggle("active", state !== "closed" && !unavailable);

    // Graphic + buttons
    root.querySelector(".body").classList.remove("hidden");
    root.querySelector(".window").classList.toggle("hidden", !this._config.show_graphic);

    const openBtn = root.querySelector('[data-action="open_cover"]');
    const stopBtn = root.querySelector('[data-action="stop_cover"]');
    const closeBtn = root.querySelector('[data-action="close_cover"]');
    openBtn.classList.toggle("hidden", !(features & SUPPORT_OPEN));
    stopBtn.classList.toggle("hidden", !(features & SUPPORT_STOP));
    closeBtn.classList.toggle("hidden", !(features & SUPPORT_CLOSE));
    openBtn.disabled = unavailable || state === "opening" || (hasPosition ? position === 100 : state === "open");
    closeBtn.disabled = unavailable || state === "closing" || state === "closed";
    stopBtn.disabled = unavailable;

    // Slider
    const slider = root.querySelector(".slider");
    slider.classList.toggle("hidden", !this._config.show_slider || !(features & SUPPORT_SET_POSITION));
    slider.disabled = unavailable;

    // Don't fight the user while they're dragging the slider
    if (!this._dragging) {
      const shown = hasPosition ? position : state === "closed" ? 0 : 100;
      slider.value = shown;
      this._showPosition(shown);
    }
  }

  /** Position: 0 = fully closed, 100 = fully open. */
  _showPosition(position) {
    this.shadowRoot.querySelector(".blind").style.height = `${100 - position}%`;
  }

  // ---- Actions ---------------------------------------------------------

  _callService(service, data = {}) {
    this._hass.callService("cover", service, { entity_id: this._config.entity, ...data });
  }

  _openMoreInfo() {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: this._config.entity },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// ---- Visual editor -----------------------------------------------------

const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "cover" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "show_graphic", selector: { boolean: {} } },
      { name: "show_slider", selector: { boolean: {} } },
    ],
  },
];

const EDITOR_LABELS = {
  entity: "Cover entity",
  name: "Name (optional)",
  icon: "Icon (optional)",
  show_graphic: "Show window graphic",
  show_slider: "Show position slider",
};

class CustomCoverCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;

    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = EDITOR_SCHEMA;
      this._form.computeLabel = (schema) => EDITOR_LABELS[schema.name] || schema.name;
      this._form.addEventListener("value-changed", (ev) => {
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: ev.detail.value },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }

    this._form.hass = this._hass;
    this._form.data = { show_graphic: true, show_slider: true, ...this._config };
  }
}

// ---- Registration ------------------------------------------------------

if (!customElements.get("custom-cover-card")) {
  customElements.define("custom-cover-card", CustomCoverCard);
}
if (!customElements.get("custom-cover-card-editor")) {
  customElements.define("custom-cover-card-editor", CustomCoverCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom-cover-card",
  name: "Custom Cover Card",
  description: "Control blinds, shades and other covers with a visual position preview.",
  preview: true,
});
