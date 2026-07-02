# Prism — Design notes (situational detail)

Deep-dive design constraints moved verbatim from CLAUDE.md on 2026-07-02. Read when touching
`PrismLogo`, the data palettes, or any chart. The always-on rules stay in CLAUDE.md.

- **Prism orientation:** the logo is an **upward-pointing** triangle (`M 100 52 L 58 132 L 142 132`) —
  the classic light-dispersion orientation. Do not rotate it back to pointing sideways.
- **PrismLogo animation contract:** In `PrismLogo`, animate ray draw-in with **`pathLength` only**
  (static geometry), and never bind entrance opacity to the looping shimmer — doing so previously
  left the rays invisible.
- **Data-palette validation history:** The muted category colors (`categories.ts`) and verdict
  colors (`verdicts.ts`) were run through a CVD/contrast validator: the misleading amber is
  **#F08C00** (the old #B7791F was indistinguishable from the red under deuteranopia) and the greys
  are **#868E96** (the old #ADB5BD failed 3:1 contrast).
- **Chart discipline (from the dataviz pass):** thin marks (proportion bar ≤24px, meter 10px),
  **2px paper gaps** between fills instead of borders/strokes, numbers live in the legend (not
  inline on every segment), proportional figures on big standalone numbers (`tabular-nums` only in
  aligned columns).
