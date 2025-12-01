# BoardScore

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel)](https://boardscore.vercel.app)
[![Build](https://img.shields.io/github/actions/workflow/status/jrmarcello/boardscore/ci.yml?style=flat-square&label=build)](https://github.com/jrmarcello/boardscore/actions)
[![License](https://img.shields.io/github/license/jrmarcello/boardscore?style=flat-square)](LICENSE)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)

Real-time digital scoreboard for board games and card games. Features automatic ranking, TV mode, and instant synchronization across devices.

## Features

| Feature | Description |
|---------|-------------|
| **Real-time sync** | Scores update instantly across all connected devices |
| **Auto-ranking** | Players reorder automatically with smooth animations |
| **TV Mode** | Fullscreen display optimized for large screens |
| **Password protection** | Secure rooms with optional passwords |
| **Dark mode** | Light/dark theme with system preference detection |
| **PWA** | Installable as a native app on mobile and desktop |
| **Offline support** | Works offline with local cache |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/jrmarcello/boardscore.git
cd boardscore

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID (optional) |

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Project Structure

```text
src/
├── components/   # Reusable React components
├── contexts/     # React contexts (Auth, Theme)
├── hooks/        # Custom hooks
├── lib/          # Utilities (firebase, sounds, analytics)
├── pages/        # Application pages
├── services/     # Firestore data access layer
└── types/        # TypeScript definitions
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7
- **Styling:** Tailwind CSS v4, Framer Motion
- **Backend:** Firebase (Firestore, Authentication)
- **Deployment:** Vercel
- **Analytics:** Google Analytics 4

## License

[MIT](LICENSE)
