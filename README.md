# 🏁 Car Bingo

WARNING: This is primarily vibe coded. Two reasons: To test Claude Code and since we needed it THIS afternoon.

A road-trip bingo card, built with Vue 3 + Vite. Get a shuffled 5×5 card of things to
spot on the road, tap a square when you see it, and race for a line — or the whole card.

## Features

- Random 5×5 card generated from a pool of road-trip sightings (`src/data/bingo.json`),
  each with an emoji, an English label, and a Dutch label
- Tap to mark/unmark a square, with confetti + a toast when you complete a line or the
  full card
- English / Dutch toggle, defaulting to your browser's language
- Light / dark toggle, defaulting to your OS preference
- Card, marks, language, and theme all persist to `localStorage`
- "New Card" asks for confirmation once you've made progress, so you don't lose a card
  by accident
- Installable PWA (add to home screen) with offline support, for the inevitable dead
  zones on a road trip

## Development

```sh
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Adding or editing squares

Each entry in `src/data/bingo.json` is self-contained — edit one object to change what
shows up on cards, no need to touch parallel lists:

```json
{ "emoji": "🚗", "en": "Red car", "nl": "Rode auto" }
```
