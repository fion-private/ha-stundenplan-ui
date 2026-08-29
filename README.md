# Stundenplan UI

[![CI](https://github.com/fion-private/ha-stundenplan-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/fion-private/ha-stundenplan-ui/actions/workflows/ci.yml)
[![HACS Custom Repository](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![License: MIT](https://img.shields.io/github/license/fion-private/ha-stundenplan-ui)](LICENSE)

<img src="branding/icon.png" alt="" width="48" height="48" align="left" style="margin-right: 12px;" />

A Home Assistant Lovelace card that displays a single day's timetable and
substitutions, sourced from the
[`stundenplan`](https://github.com/fion-private/ha-stundenplan) integration's
`sensor.<class>_tagesplan` entity. Cancelled and changed lessons are
highlighted, the current lesson is tracked live, and split/parallel course
groups are grouped under one time slot.

This card is the frontend companion to the **Stundenplan** integration -
install that first, it does the actual data fetching.

## Installation

### Option A: HACS (recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=fion-private&repository=ha-stundenplan-ui&category=plugin)

1. Click the button above (or in HACS: **⋮ → Custom repositories**, add
   `https://github.com/fion-private/ha-stundenplan-ui` as category
   **Dashboard** / **Plugin**).
2. Find **Stundenplan UI** in HACS and click **Download**.
3. Reload your browser (HACS adds the Lovelace resource automatically).
4. Continue with [Configuration](#configuration) below.

### Option B: Manual installation

1. Download `stundenplan-card.js` from the
   [latest release](https://github.com/fion-private/ha-stundenplan-ui/releases/latest).
2. Copy it into `<config>/www/stundenplan-card.js`.
3. Add it as a Lovelace resource: **Settings → Dashboards → ⋮ → Resources →
   Add Resource**, URL `/local/stundenplan-card.js`, type **JavaScript
   Module**.
4. Continue with [Configuration](#configuration) below.

## Configuration

Add the card via the dashboard UI (**Edit Dashboard → Add Card → search for
"Stundenplan"**) and pick the day-plan entity in the visual editor, or use
YAML:

```yaml
type: custom:stundenplan-card
entity: sensor.stundenplan_8a_tagesplan # required: the day-plan entity
title: Stundenplan # optional, overrides the default title (the entity's name)
compact: false # optional, defaults to false
```

| Option    | Required | Default             | Description                                                                                        |
| --------- | -------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `entity`  | yes      | –                     | The `sensor.<class>_tagesplan` entity from the Stundenplan integration.                              |
| `title`   | no       | entity's friendly name | Overrides the header title.                                                                          |
| `compact` | no       | `false`               | Hides teacher/room and uses tighter spacing - useful for smaller dashboard columns.                  |

## What the card shows

- **Header**: `mdi:school-outline` icon (same as the integration), title and
  the plan's target date.
- **Timeline**: one row per period. Multiple lessons in the same period
  (split/parallel course groups) are grouped under a shared time slot, each
  tagged with its course badge.
- **Status colors**: regular lessons in the default text color; changed
  lessons in amber with a "Changed" badge; cancelled lessons struck through
  in red with a "Cancelled" badge. The hint text from the plan is always
  shown.
- **Live highlighting**: when the plan's target date is today, the lesson
  currently in progress is highlighted with a "Now" badge, and past lessons
  are dimmed. The card re-evaluates this every minute while visible. Before
  or after the target day, no lesson is highlighted or dimmed.
- **Empty state**: a compact placeholder is shown when the entity reports no
  plan for tomorrow (weekend, holidays, or the source not published yet).
- **Compact mode**: `compact: true` drops the teacher/room line and tightens
  row spacing, for narrower dashboard columns.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup and running the
linter (ESLint + Prettier), type checker (`tsc`) and unit test suite
(Vitest) - the same checks enforced by the
[CI pipeline](.github/workflows/ci.yml) on every push and pull request.

## License

[MIT](LICENSE)
