# 粵拼拼字 · Cantonese Scrabble

An offline, two-player Cantonese word game in the spirit of Scrabble, built with
React + Vite. Players take turns placing tiles on a 9×9 board to form valid
Cantonese words, validated against a built-in dictionary (with Jyutping and
English glosses). Pass-and-play on a single device, with a hide-rack
interstitial so opponents can't peek.

## Features

- 9×9 board with word/character multiplier squares and a center star.
- Drag-and-drop or tap-to-place tiles (`@dnd-kit`).
- Dictionary validation with Jyutping + English definitions and sound-alike
  matching.
- Tile exchange, recall, pass, and bingo (full-rack) bonuses.
- Synthesized sound effects via the Web Audio API (no audio assets).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## Project structure

```
src/
  config/      Board multipliers and game constants
  game/        Pure game logic (tile bag, validation, scoring, dictionary)
  services/    Side-effecting services (sound synthesis)
  hooks/       React state hooks
  components/  UI components (Board, Tile, Rack, panels, modals)
  styles/      Stylesheets, split by concern
  data/        Dictionary and word-set JSON
scripts/       One-off data-processing tools
```

## Tech stack

React 18, Vite 5, `@dnd-kit/core`, ESLint.
