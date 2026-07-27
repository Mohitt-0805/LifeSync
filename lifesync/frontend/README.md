# LifeSync Frontend Client

Vite React application utilizing Redux Toolkit (RTK Query), Framer Motion, and Tailwind CSS.

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Runs on [http://localhost:5173](http://localhost:5173). Calls to `/api` are automatically proxied to the backend port 5000.

3. **Build Production Assets**:
   ```bash
   npm run build
   ```

## Design System & Themes
- **Theme toggle**: Light/Dark classes are attached to `documentElement` and managed via `ThemeContext.jsx`.
- **Brutalist Flat Shadows**: Custom Tailwind shadow extensions (`shadow-retro`, `shadow-retro-tasks`, etc.) represent our tactile design system.
- **Micro-animations**: Interactive elements animate using custom `framer-motion` springs or transition ease-outs.
- **Reusable Primitives**: Includes custom `Button`, `Card`, `Input`, `Badge`, `ProgressBar`, `Dropdown`, and `Skeleton` elements.
