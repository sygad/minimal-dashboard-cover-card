# Minimal Dashboard Cover Card

A simple Home Assistant card with open, stop and close buttons for your blinds, shades and other covers.

![Minimal Dashboard Cover Card](Images/Cover%20card%20reference%20design.png)

- Buttons are hidden if your cover doesn't support them
- Buttons are greyed out when they can't be used (e.g. "Open" when already fully open)
- Every icon can be changed
- Visual editor, so you don't need to write YAML

## Installation (HACS)

1. In Home Assistant, open **HACS**.
2. Click the **⋮** menu (top right), then **Custom repositories**.
3. Paste `https://github.com/sygad/minimal-dashboard-cover-card`, set **Type** to **Dashboard**, and click **Add**.
4. Search for **Minimal Dashboard Cover Card**, open it, and click **Download**.
5. Refresh your browser.

## Usage

Edit a dashboard, click **Add card**, and search for **Minimal Dashboard Cover Card**.

Or with YAML:

```yaml
type: custom:minimal-dashboard-cover-card
entity: cover.living_room_blind
open_icon: mdi:arrow-up-thin              # optional
stop_icon: mdi:square-rounded-outline     # optional
close_icon: mdi:arrow-down-thin           # optional
```

## Options

| Option       | Default                      | Description                |
| ------------ | ---------------------------- | -------------------------- |
| `entity`     | **required**                 | A `cover.` entity          |
| `open_icon`  | `mdi:arrow-up-thin`          | Icon on the open button    |
| `stop_icon`  | `mdi:square-rounded-outline` | Icon on the stop button    |
| `close_icon` | `mdi:arrow-down-thin`        | Icon on the close button   |

## Theme colours (optional)

You can change the colours from your theme with these variables:

| Variable                         | Default   |
| -------------------------------- | --------- |
| `mdc-cover-card-background`      | `#01152f` |
| `mdc-cover-button-background`    | `#002c65` |
| `mdc-cover-icon-color`           | `#ffffff` |
| `mdc-cover-icon-size`            | `40px`    |
