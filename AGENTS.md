# Agent Guidelines

Instructions for AI agents working on this repository.

## Project Overview

**BoardScore** is a real-time digital scoreboard for board games and card games. Built with React + TypeScript and Firebase as backend.

**Live:** [boardscore.vercel.app](https://boardscore.vercel.app)

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite 7, TypeScript 5.6 |
| Styling | Tailwind CSS v4, Framer Motion |
| Backend | Firebase (Firestore, Authentication) |
| Deployment | Vercel |
| Analytics | Google Analytics 4 |

## Project Structure

```text
src/
├── components/     # Reusable React components
├── contexts/       # React contexts (Auth, Theme)
├── hooks/          # Custom hooks (useScoreboard)
├── lib/            # Utilities (firebase, sounds, history, analytics)
├── pages/          # Application pages
├── services/       # Firestore data access layer
└── types/          # TypeScript definitions
```

## Code Conventions

### Commits

Use Conventional Commits:

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code refactoring without behavior change |
| `docs:` | Documentation only |
| `chore:` | Maintenance tasks |

### TypeScript

- Prefer `interface` over `type` for objects
- Use explicit types in public functions
- Avoid `any`, use `unknown` when necessary

### React

- Functional components with hooks
- Custom hooks for reusable logic
- Lazy loading for pages (configured in App.tsx)

### Tailwind CSS

- Dark mode: `@custom-variant dark (&:where(.dark, .dark *))`
- Prefer utility classes over custom CSS

## Firebase/Firestore

### Collections

| Collection | Description |
|------------|-------------|
| `users/{userId}` | User profile, recent rooms |
| `rooms/{roomId}` | Room data (name, owner, password hash) |
| `rooms/{roomId}/players/{playerId}` | Players and scores |

### Security Rules

Rules are in `firestore.rules`. After changes:

```bash
npx firebase-tools deploy --only firestore:rules
```

### Read Optimization

- Use `onSnapshot` for real-time data (avoids polling)
- Offline cache enabled via `persistentLocalCache`
- Avoid duplicate `getDoc` + `onSnapshot` calls

## Important Patterns

### Room Passwords

- Hash with SHA-256 + unique salt
- Storage format: `salt:hash`
- Backward compatible with legacy format (hash only)

### Nickname vs DisplayName

| Field | Description |
|-------|-------------|
| `displayName` | Google account name (read-only) |
| `nickname` | User-customizable name |

Never overwrite existing nickname on login.

### Action History

- Persisted via sessionStorage per room
- Survives page refresh, clears on tab close
- Actions: score changes, player join/leave, reset, clear
- Maximum 50 entries per room

### Analytics

Events are tracked via `src/lib/analytics.ts`:

- Auth: `login`, `logout`, `nickname_changed`
- Rooms: `room_created`, `room_joined`
- Players: `player_added`, `player_removed`
- Scores: `score_changed`, `scores_reset`, `board_cleared`
- Features: `tv_mode_opened`, `theme_changed`

Disabled in development mode.

## Testing

Not yet implemented. When adding:

- Use Vitest for unit tests
- Use React Testing Library for components
