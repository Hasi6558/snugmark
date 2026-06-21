# Snugmark 🔖

> **A calm place for your links.**  
> Save, organize, and revisit the web's best with collections, tags, and favourites.

Snugmark is a self-hosted personal bookmark manager. It is a full-stack monorepo consisting of a **React / TanStack Start** frontend, an **Express 5 + MongoDB** backend, and a native Windows launcher that starts everything with a single double-click.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Run in Development](#3-run-in-development)
  - [4. Using the Launcher (Windows)](#4-using-the-launcher-windows)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Architecture Overview](#architecture-overview)
- [Scripts](#scripts)
- [License](#license)

---

## Features

- 📁 **Collections** — Organise links into nested collections (one level deep), with drag-and-drop reordering.
- 🔒 **Collection locking** — Protect collections with your account password; locked collections are hidden until unlocked for the session.
- 🏷️ **Tags** — Colour-coded tags (6 colours) for cross-collection filtering.
- ⭐ **Favourites & Read state** — Mark links as favourite or read/unread.
- 📊 **Visit tracking** — Records visit count and last-visited date every time you open a link.
- 🔗 **Metadata auto-fetch** — Paste a URL and the backend fetches its title, description, and favicon automatically.
- 🔍 **Filtering & search** — Filter the home view by tag, collection, favourite, or read status.
- 🖱️ **Drag-and-drop** — Reorder collections and links inside a collection via `@dnd-kit`.
- 🔐 **JWT auth** — Stateless Bearer-token authentication; each user sees only their own data.

---

## Project Structure

```
snugmark/                        # Monorepo root
├── snugmark-be/                 # Backend (Express 5 + Mongoose)
│   └── src/
│       ├── index.ts             # Server bootstrap
│       ├── app.ts               # Express app factory
│       ├── db.ts                # Mongoose connection
│       ├── env.ts               # Zod-validated env config
│       ├── controllers/         # Route handlers
│       │   ├── auth.controller.ts
│       │   ├── collections.controller.ts
│       │   ├── links.controller.ts
│       │   ├── tags.controller.ts
│       │   └── metadata.controller.ts
│       ├── models/              # Mongoose schemas
│       │   ├── User.ts
│       │   ├── Collection.ts
│       │   ├── Link.ts
│       │   └── Tag.ts
│       ├── routes/              # Express routers
│       ├── middleware/          # Auth, validation, error handling
│       ├── services/            # Metadata fetch & parse service
│       └── lib/                 # JWT & bcrypt helpers
│
├── snugmark-fe/                 # Frontend (TanStack Start + React 19)
│   └── src/
│       ├── routes/              # File-based routes (TanStack Router)
│       │   ├── __root.tsx       # Root layout
│       │   ├── index.tsx        # Main app (auth-gated)
│       │   ├── login.tsx
│       │   └── register.tsx
│       ├── components/
│       │   └── linkboard/       # Core UI components
│       │       ├── Sidebar.tsx
│       │       ├── HomeView.tsx
│       │       ├── CollectionView.tsx
│       │       ├── LinkCard.tsx
│       │       ├── LinkModal.tsx
│       │       ├── FilterBar.tsx
│       │       ├── Sidebar.tsx
│       │       └── ...
│       ├── lib/
│       │   ├── api/client.ts    # Fetch wrapper with JWT injection
│       │   └── linkboard-store.tsx  # React context / state store
│       └── hooks/               # Custom React hooks
│
└── launcher/                    # Windows launcher (Node + pkg)
    └── index.js                 # Starts BE + FE, opens browser
```

---

## Tech Stack

### Backend (`snugmark-be`)
| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Validation | Zod |
| Metadata parsing | `node-html-parser` + native `fetch` |
| Language | TypeScript 5 |
| Dev runner | `tsx watch` |

### Frontend (`snugmark-fe`)
| Layer | Technology |
|---|---|
| Framework | TanStack Start (Vite + Nitro) |
| UI Library | React 19 |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query v5 |
| Component library | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v4 |
| Drag-and-drop | `@dnd-kit` |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Language | TypeScript 5 |

### Launcher
| Component | Technology |
|---|---|
| Script | Node.js (CommonJS) |
| Packaging | `pkg` → `snugmark.exe` |
| Ports | BE `:5201`, FE `:5202` |

---

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (default: `mongodb://localhost:27017/snugmark`)  
  _or_ a MongoDB Atlas connection string

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd snugmark

# Install backend dependencies
cd snugmark-be && npm install

# Install frontend dependencies
cd ../snugmark-fe && npm install   # or: bun install
```

### 2. Configure Environment Variables

Copy the example env file in the backend and fill in your values:

```bash
cd snugmark-be
cp .env.example .env
```

Edit `snugmark-be/.env`:

```env
PORT=5201

# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/snugmark

# JWT — replace with a long, random secret
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d

# Allowed CORS origin (the frontend dev server)
CORS_ORIGIN=http://localhost:5202
```

Create a `.env` in the frontend:

```bash
# snugmark-fe/.env
VITE_API_URL=http://localhost:5201/api
```

### 3. Run in Development

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd snugmark-be
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd snugmark-fe
npm run dev
```

Then visit [http://localhost:5202](http://localhost:5202) in your browser.

### 4. Using the Launcher (Windows)

A pre-built `snugmark.exe` is provided in the repo root. It:

1. Detects installed browsers (Brave, Chrome, Edge, Firefox) and asks you to pick one on first run — saving the preference to `snugmark-launcher.json`.
2. Starts the backend and frontend `npm run dev` servers in the background.
3. Waits up to 90 seconds for both to become ready, then opens the app in your chosen browser.
4. Detaches the servers so they keep running after the launcher window closes.

Simply **double-click `snugmark.exe`** from the project root.

> **Tip:** Delete `snugmark-launcher.json` to reset your browser preference.

To rebuild the launcher from source:
```bash
cd launcher
npm install
npx pkg index.js --target node18-win-x64 --output ../snugmark.exe
```

---

## API Reference

All routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`
| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/register` | `{ name, email, password }` | Create a new account |
| `POST` | `/login` | `{ email, password }` | Sign in, returns JWT |
| `GET` | `/me` | — | Validate token, return current user |
| `POST` | `/verify-password` | `{ password }` | Verify account password (used by lock dialogs) |

### Collections — `/api/collections` 🔐
| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/` | — | List all collections (sorted by order) |
| `POST` | `/` | `{ name, parentId? }` | Create a collection |
| `PATCH` | `/:id` | `{ name }` | Rename a collection |
| `DELETE` | `/:id` | — | Delete collection and cascade-delete children + their links |
| `PATCH` | `/reorder` | `{ orderedIds }` | Reorder top-level collections |
| `POST` | `/:id/lock` | `{ password }` | Lock a collection |
| `POST` | `/:id/remove-lock` | `{ password }` | Remove lock from a collection |
| `POST` | `/:id/unlock` | `{ password }` | Verify password and grant session unlock |

### Links — `/api/links` 🔐
| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/` | — | List all links |
| `POST` | `/` | `{ collectionId, url, title, description, favicon, tagIds }` | Add a link |
| `PATCH` | `/:id` | Partial: `url, title, description, favicon, tagIds, isFavourite, isRead` | Update link fields |
| `DELETE` | `/:id` | — | Delete a link |
| `POST` | `/:id/visit` | — | Record a visit (`visitCount++`, `lastVisitedAt=now`, `isRead=true`) |
| `PATCH` | `/:id/move` | `{ targetCollectionId }` | Move link to another collection |
| `PATCH` | `/reorder` | `{ collectionId, orderedIds }` | Reorder links within a collection |

### Tags — `/api/tags` 🔐
| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/` | — | List all tags |
| `POST` | `/` | `{ name }` | Create or return existing tag (case-insensitive dedup) |

### Metadata — `/api/metadata` 🔐
| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/` | `{ url }` | Fetch title, description, and favicon for a URL |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ status: "ok", uptime }` |

---

## Data Models

### User
```ts
{ _id, name, email (unique), passwordHash, createdAt, updatedAt }
```

### Collection
```ts
{
  _id, userId,
  parentId,     // null = top-level; supports one level of nesting
  name,
  order,        // sort position among siblings
  locked,       // boolean — password-protected
  createdAt, updatedAt
}
```

### Link
```ts
{
  _id, userId, collectionId,
  url, title, description, favicon,
  isFavourite, isRead,
  position,          // sort order within the collection
  tagIds,            // array of Tag refs
  visitCount,
  lastVisitedAt,
  createdAt, updatedAt
}
```

### Tag
```ts
{
  _id, userId,
  name,              // unique per user (case-insensitive)
  colorIndex,        // 1–6, cycles automatically
  createdAt, updatedAt
}
```

> All API responses serialize `_id` → `id` and strip `__v` and `passwordHash`.

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Browser / Client            │
│   TanStack Start + React 19         │
│   TanStack Router (file-based)      │
│   TanStack Query (data layer)       │
│   shadcn/ui + Tailwind CSS v4       │
└──────────────┬──────────────────────┘
               │  REST API (Bearer JWT)
               ▼
┌─────────────────────────────────────┐
│         Express 5 Backend           │
│  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │ Routes/Controllers│ │
│  │ JWT/bcrypt│  │ Collections      │ │
│  └──────────┘  │ Links            │ │
│                │ Tags             │ │
│                │ Metadata         │ │
│                └──────────────────┘ │
│         Zod validation middleware   │
└──────────────┬──────────────────────┘
               │  Mongoose ODM
               ▼
┌─────────────────────────────────────┐
│              MongoDB                │
│  users / collections / links / tags │
└─────────────────────────────────────┘
```

---

## Scripts

### Backend (`snugmark-be`)
| Script | Description |
|---|---|
| `npm run dev` | Start with `tsx watch` (hot-reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled `dist/index.js` |
| `npm run typecheck` | Type-check without emitting |
| `npm run seed` | Run `src/scripts/seed.ts` to populate sample data |

### Frontend (`snugmark-fe`)
| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Notes

- **Collection locking** is a UI-level feature: locked collection links are still returned by the API but hidden in the interface until unlocked for the current session. Stricter server-side enforcement (per-session unlock tokens) is a planned future improvement.
- **Metadata SSRF guard**: the metadata endpoint blocks requests to internal/private IP ranges (`localhost`, `127.x`, `10.x`, `192.168.x`, `169.254.x`) to prevent server-side request forgery.
- **Token expiry**: the default JWT lifetime is 7 days. Refresh-token flows are out of scope for the current version.

---

## License

This project is publicly visible for educational and portfolio purposes only.

All rights are reserved by the author. No commercial use, production deployment, redistribution, modification, or derivative works are permitted without explicit written permission.

See [LICENSE](./LICENSE) for the full license text.
