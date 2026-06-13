# Design system

A coverage map, not a script. Decisions in dependency order: colours → typography. The user
brings the values; the skill brings the role structure and the reasoning.

## Defaults — state them, don't ask

- **Tokens name roles, never values.** `primary`, not `blue500`: a role survives a rebrand, a
  value doesn't — and a role tells the next screen *where* to use it.
- **Single palette first.** Theming (dark mode, alternative palettes) is a mapping over roles —
  it only works if the roles exist and are used consistently. Adding it later is mechanical;
  designing it now multiplies every colour decision before any screen exists.
- **Components, spacing and shapes are not bootstrap decisions.** They emerge from building
  screens; defining them up front is speculation that the first real screen overturns.

## Colours — the role set

One token per role; concrete values are the user's decision, captured in the bootstrap record.

- **Brand**: `primary`/`onPrimary`, `secondary`/`onSecondary`. Every base colour that carries
  content gets its `on*` pair — the pair is a *contrast contract*, the thing you can verify
  (WCAG AA, 4.5:1 for normal text) before a single screen exists.
- **Text**: `text1`/`text2`/`text3` (primary, supporting, de-emphasised). Three tiers express
  hierarchy without the ad-hoc opacity tweaks that otherwise multiply per screen.
- **Surface** — the background stack, bottom to top: `screen` → `card` → `sheet`. Every UI
  element sits on exactly one of these layers; naming the stack is what lets elevation and
  dark mode be decided once instead of per component.
- **Other**: `border` (strokes, dividers), `error` (validation, destructive accents).

Grows into — add only when a real use appears, never preemptively: selection states, semantic
colours (success/warning), overlay/scrim, disabled, a dedicated text-on-brand token (only if
it ever needs to diverge from `onPrimary` — one role, one token).

## Typography — the role hierarchy

Styles are named by their role in the screen's hierarchy — never by visual scale. "Large" and
"medium" describe today's value, not a role, and stop meaning anything the day the values
change; `sectionTitle` still means the same thing after three redesigns.

Hierarchy, top to bottom: `screenTitle` → `sectionTitle` → `header` → `body`, plus two utility
tiers:

- `screenTitle` — the screen's main title (typically the top bar, one per screen).
- `sectionTitle` — titles of sections within a screen: groups, cards, sheets.
- `header` — heading of a content unit below section level: list row titles, option titles.
  Heavier than `body`, typically sits directly above it.
- `body` — default reading text: dialog prose, paragraphs.
- `label` — small utility text: interactive controls (buttons, chips), a row's second line.
- `caption` — the smallest text: timestamps, badges, footers.

Rules, each with its why:

- **A style is its full spec** — family, weight, size, line height, case/tracking. If a
  component exists only to apply text styling, the style is incomplete: absorb the styling and
  delete the component, or every screen pays a wrapper for what a token should carry.
- **One font family to start**, with the minimum weights the hierarchy needs — typically two,
  three when `header` must read between `sectionTitle` and `body`. Weights are cheap to add
  later and expensive to unify later.
- **No case/tracking treatment by default** — add per style only when a role requires it.
- **A new style requires a new role in the hierarchy.** "This card wants 14sp" is not a role —
  it is the first step toward a style-per-screen system nobody can name.

Grows into: `display` (oversized hero/prompt text), `overline` (uppercase divider headings).
