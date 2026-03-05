# Germs.io Clone

A faithful visual and functional clone of [germs.io](https://germs.io) built with **Vite** (vanilla JS + Canvas).

## Features

- Full menu screen with nickname input, skin preview, play/spectate buttons
- Animated canvas background on menu
- Live gameplay: move your cell, eat food & other blobs, split, eject mass
- Leaderboard, XP bar, minimap, chat, HUD
- Settings panel: Gameplay, Themes, Controls (rebindable), Region
- Skins panel with custom skin URL support
- Party system (create/join with code)
- Match results screen
- Fully responsive

## Getting Started

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

The output goes to `dist/`.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Import it in [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — no config needed (the `vercel.json` handles SPA routing)

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel --prod
```

## Notes

- This is a **frontend-only** clone. Real multiplayer would require a WebSocket server (not included).
- All assets (logo, skins, social icons) are loaded directly from `https://germs.io` via their CDN.
- Login/auth buttons are stubbed — implement OAuth server-side as needed.
