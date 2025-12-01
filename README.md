# BoardScore

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel)](https://boardscore.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/github/license/jrmarcello/boardscore?style=flat-square)](LICENSE)

Real-time digital scoreboard for board games and card games. Players compete
with automatic ranking, TV mode for big screens, and instant sync across devices.

## Features

- **Real-time Sync** — Scores update instantly across all connected devices
- **Auto-ranking** — Players reorder automatically with smooth animations
- **TV Mode** — Fullscreen display optimized for large screens
- **Password Protection** — Secure rooms with optional passwords
- **Dark Mode** — System-aware theme switching
- **PWA Support** — Installable on mobile with offline capabilities

## Tech Stack

| | |
|-----------|----------------------------------------------|
| Framework | React 19, Vite 7 |
| Language | TypeScript 5.6 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| Styling | Tailwind CSS v4, Framer Motion |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project ([create project](https://console.firebase.google.com))

### Installation

```bash
git clone https://github.com/jrmarcello/boardscore.git
cd boardscore
cp .env.example .env.local
npm install
npm run dev
```

### Environment Variables

```bash
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Analytics (optional)
VITE_GA_MEASUREMENT_ID=
```

## Project Structure

```text
src/
├── components/     # React components
│   ├── ui/         # Primitives (Avatar, Logo, PlayerCard)
│   └── ...         # Feature components
├── contexts/       # Auth and Theme providers
├── hooks/          # Custom hooks (useScoreboard)
├── lib/            # Firebase, sounds, analytics
├── pages/          # Route pages
├── services/       # Firestore data access layer
└── types/          # TypeScript definitions
```

## Scripts

| | |
|-------------------|-------------------------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
