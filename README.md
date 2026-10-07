# Custom Cover Card

A Home Assistant Lovelace card for controlling covers (blinds, shades, shutters, garage doors).

- Open / stop / close buttons (shown only if your cover supports them)
- Position slider
- Window graphic that shows how far the blind is open
- Visual editor, so you don't need to write YAML

## Installation (HACS)

1. In Home Assistant, open **HACS**.
2. Click the **⋮** menu (top right), then **Custom repositories**.
3. Paste this repository's URL, set **Type** to **Dashboard**, and click **Add**.
4. Search for **Custom Cover Card**, open it, and click **Download**.
5. Reload your browser when prompted.

## Usage

Edit a dashboard, click **Add card**, and search for **Custom Cover Card**.

Or with YAML:

```yaml
type: custom:custom-cover-card
entity: cover.living_room_blind
name: Living Room        # optional
icon: mdi:blinds         # optional
show_graphic: true       # optional, default true
show_slider: true        # optional, default true
```

## Options

| Option         | Type    | Default        | Description                       |
| -------------- | ------- | -------------- | --------------------------------- |
| `entity`       | string  | **required**   | A `cover.` entity                 |
| `name`         | string  | friendly name  | Card title                        |
| `icon`         | string  | shutter icon   | Header icon                       |
| `show_graphic` | boolean | `true`         | Show the window/blind graphic     |
| `show_slider`  | boolean | `true`         | Show the position slider          |
