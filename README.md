# Germs.io Clone

A faithful recreation of the [germs.io](https://germs.io) lobby/UI built with **Vite + React**, ready to deploy on Vercel.

## Features

- 🎮 Animated canvas background with floating cells, food pellets, and grid
- 🏆 Rankings leaderboard panel (left)
- ▶️ Play panel with name input, server/mode selection, login prompt, social links (center)
- 🎨 Skins panel with tab navigation, search, custom skin URL (right)
- ⚙️ Settings modal with Gameplay, Themes, Controls, and Region tabs
- 📊 Match Results modal
- 📱 Responsive (side panels hidden on smaller screens)

## Getting Started

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Vercel will auto-detect Vite — no configuration needed
4. Click **Deploy**

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the build locally
```

## Notes

- This is a **frontend-only** clone of the germs.io UI/lobby. It does not include actual multiplayer game logic.
- To add real gameplay, integrate a WebSocket server and canvas-based game loop.
