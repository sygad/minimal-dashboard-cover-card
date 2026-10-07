/**
 * Minimal Dashboard Cover Card for Home Assistant
 * A simple open / stop / close button bar for cover entities (blinds, shades, garage doors, ...).
 */

const CARD_VERSION = "0.2.0";

console.info(
  `%c MINIMAL-DASHBOARD-COVER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #002c65; font-weight: 700;",
  "color: #002c65; background: white; font-weight: 700;"
);

// Cover feature flags (from homeassistant/components/cover/__init__.py)
const SUPPORT_OPEN = 1;
const SUPPORT_CLOSE = 2;
const SUPPORT_STOP = 8;

const DEFAULT_ICONS = {
  open_icon: "mdi:arrow-up-thin",
  stop_icon: "mdi:square-rounded-outline",
  close_icon: "mdi:arrow-down-thin",
};

const BUTTONS = [
  { action: "open_cover", iconKey: "open_icon", label: "Open", feature: SUPPORT_OPEN },
  { action: "stop_cover", iconKey: "stop_icon", label: "Stop", feature: SUPPORT_STOP },
  { action: "close_cover", iconKey: "close_icon", label: "Close", feature: SUPPORT_CLOSE },
];

// Colours can be overridden from a theme with these CSS variables.
const STYLES = `
  ha-card {
    display: flex;
    gap: 8px;
    padding: 8px;
    height: 100%;
    box-sizing: border-box;
    border: none;
    border-radius: var(--mdc-cover-card-radius, 16px);
    background: var(--mdc-cover-card-background, #01152f);
  }
  .btn {
    flex: 1;
    min-height: 56px;
    border: none;
    border-radius: var(--mdc-cover-button-radius, 12px);
    background: var(--mdc-cover-button-background, #002c65);
    color: var(--mdc-cover-icon-color, #ffffff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: filter 0.15s, opacity 0.15s;
    --mdc-icon-size: var(--mdc-cover-icon-size, 40px);
  }
  .btn:hover:not([disabled]) {
    filter: brightness(1.25);
  }
  .btn:active:not([disabled]) {
    filter: brightness(1.5);
  }
  .btn[disabled] {
    opacity: 0.4;
    cursor: default;
  }
  .btn.hidden {
    display: none;
  }
  .warning {
    color: #ffffff;
    padding: 8px;
  }
`;

class MinimalDashboardCoverCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // ---- Lovelace API ----------------------------------------------------

  static getConfigElement() {
    return document.createElement("minimal-dashboard-cover-card-editor");
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass.states).find((id) => id.startsWith("cover.")) || "";
    return { entity };
  }

  setConfig(config) {
    if (!config.entity || !config.entity.startsWith("cover.")) {
      throw new Error("Please set a cover entity, e.g. entity: cover.living_room_blind");
    }
    this._config = { ...DEFAULT_ICONS, ...config };
    this._built = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: 12, rows: 2, min_columns: 6, min_rows: 1 };
  }

  // ---- Rendering -------------------------------------------------------

  _build() {
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <ha-card>
        ${BUTTONS.map(
          (b) => `
          <button class="btn" data-action="${b.action}" title="${b.label}" aria-label="${b.label}">
            <ha-icon></ha-icon>
          </button>`
        ).join("")}
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll(".btn").forEach((btn) =>
      btn.addEventListener("click", () => this._callService(btn.dataset.action))
    );

    this._built = true;
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._build();

    const stateObj = this._hass.states[this._config.entity];
    const card = this.shadowRoot.querySelector("ha-card");

    if (!stateObj) {
      card.innerHTML = `<div class="warning">Entity not found: ${this._config.entity}</div>`;
      this._built = false;
      return;
    }

    const state = stateObj.state;
    const features = stateObj.attributes.supported_features || 0;
    const position = stateObj.attributes.current_position;
    const hasPosition = typeof position === "number";
    const unavailable = state === "unavailable" || state === "unknown";

    const disabled = {
      open_cover: unavailable || state === "opening" || (hasPosition ? position === 100 : state === "open"),
      stop_cover: unavailable,
      close_cover: unavailable || state === "closing" || state === "closed",
    };

    BUTTONS.forEach((b) => {
      const btn = this.shadowRoot.querySelector(`[data-action="${b.action}"]`);
      btn.classList.toggle("hidden", !(features & b.feature));
      btn.disabled = disabled[b.action];
      btn.querySelector("ha-icon").setAttribute("icon", this._config[b.iconKey] || DEFAULT_ICONS[b.iconKey]);
    });
  }

  // ---- Actions ---------------------------------------------------------

  _callService(service) {
    this._hass.callService("cover", service, { entity_id: this._config.entity });
  }
}

// ---- Visual editor -----------------------------------------------------

const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "cover" } } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "open_icon", selector: { icon: { placeholder: DEFAULT_ICONS.open_icon } } },
      { name: "stop_icon", selector: { icon: { placeholder: DEFAULT_ICONS.stop_icon } } },
      { name: "close_icon", selector: { icon: { placeholder: DEFAULT_ICONS.close_icon } } },
    ],
  },
];

const EDITOR_LABELS = {
  entity: "Cover entity",
  open_icon: "Open icon",
  stop_icon: "Stop icon",
  close_icon: "Close icon",
};

class MinimalDashboardCoverCardEditor extends HTMLElement {
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
        // Drop empty icon fields so the defaults are used
        const config = { ...ev.detail.value };
        Object.keys(DEFAULT_ICONS).forEach((key) => {
          if (!config[key]) delete config[key];
        });
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }

    this._form.hass = this._hass;
    this._form.data = this._config;
  }
}

// ---- Registration ------------------------------------------------------

if (!customElements.get("minimal-dashboard-cover-card")) {
  customElements.define("minimal-dashboard-cover-card", MinimalDashboardCoverCard);
}
if (!customElements.get("minimal-dashboard-cover-card-editor")) {
  customElements.define("minimal-dashboard-cover-card-editor", MinimalDashboardCoverCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "minimal-dashboard-cover-card",
  name: "Minimal Dashboard Cover Card",
  description: "A simple open / stop / close button bar for blinds and other covers.",
  preview: true,
});
