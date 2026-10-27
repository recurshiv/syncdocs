# SyncDocs — Rich-Text Document Workspace

A full-stack document editor built on the MERN stack. Users sign up, create documents, write with rich-text formatting, and every change is saved automatically. Documents are private to their owner.

**Live demo:** _add deployment URL_ · **Demo video:** _add video link_

![Editor](docs/screenshots/editor-desktop.png)

## Problem statement

Students and teachers write a lot of structured text: notes, lesson plans, assignments. The tools they reach for often fail in quiet ways. Work typed just before a connection drops is lost, "saved" indicators appear before the server has the data, and editing the same document in two tabs lets one silently overwrite the other. Losing written work is costly, and users usually find out too late.

## Target users

- Students writing notes and assignments
- Teachers and tutors drafting lesson plans and course material
- Anyone who needs a private, formatted document that is available from any device

## Solution

SyncDocs is a private document workspace whose core promise is that **what you write is not silently lost**:

- Every user has an account, and documents are visible only to their owner (enforced on the server, not just hidden in the UI).
- The editor saves automatically, and "Saved" appears only after the server has confirmed the latest edits.
- When saving fails, edits stay in the editor, the failure is shown, and the user can retry. Leaving the page with unsaved work triggers a save first and a warning if that fails.
- If the same document was changed elsewhere, the stale save is rejected instead of overwriting the newer version.

## Core workflows

1. **Account:** sign up, log in, stay logged in across visits, log out.
2. **Write:** create a document and write with headings, lists, bold, italic, and quotes; changes are saved automatically.
3. **Recover from failures:** a failed save is shown with a retry option; leaving with unsaved edits is caught.
4. **Manage documents:** browse documents newest first with previews; rename and delete them.
5. **Detect conflicts:** a save based on an outdated version is rejected with a clear message.

| Dashboard | Mobile |
|---|---|
| ![Dashboard](docs/screenshots/dashboard-desktop.png) | ![Mobile editor](docs/screenshots/editor-mobile.png) |

## Features

- Email/password accounts with server-side sessions (signup, login, logout)
- Dashboard of your documents, newest first, with a text preview
- Create, open, rename, and delete documents (delete asks for confirmation)
- Rich-text editor: headings (H1–H3), bold, italic, bullet and numbered lists, quotes, undo/redo, keyboard shortcuts
- Autosave 800 ms after typing stops, with a visible status: Saved / Unsaved changes / Saving… / Couldn't save / Changed elsewhere
- Failed saves keep your edits and can be retried; leaving the editor with unsaved edits saves first and warns if that fails
- Stale saves are detected with document revisions instead of silently overwriting newer content
- Responsive layout for desktop and mobile

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Tiptap 3, Lucide icons |
| Backend | Node.js, Express 5, TypeScript, Zod (validation), bcryptjs, express-rate-limit |
| Database | MongoDB (Atlas) with Mongoose |

## Architecture

```
Browser ── React UI + Tiptap editor
   │  fetch('/api/...')  (session cookie sent automatically, same origin)
   ▼
Express ── routes → middleware (auth, validation, CSRF) → controllers → services → models
   │
   ▼
MongoDB ── users, sessions, documents
```

In production one Express server serves both the built React app and the `/api` routes from the same origin. In development, Vite serves the React app on port 5173 and proxies `/api` to Express on port 4000.

### Server layers (`server/src`)

| Folder | Responsibility |
|---|---|
| `routes/` | Map URL + HTTP method to middleware and a controller |
| `middleware/` | `requireAuth` (session → user), `validateBody` (Zod), `requireSameOrigin` (CSRF) |
| `controllers/` | Read the validated request, call a service, send the HTTP response |
| `services/` | Business logic: authentication, sessions, document operations |
| `models/` | Mongoose schemas and indexes |
| `validation/` | Zod schemas for request bodies |

### Client structure (`client/src`)

| Folder | Responsibility |
|---|---|
| `api/` | `apiFetch` wrapper and one function per endpoint |
| `auth/`, `hooks/useAuth.ts` | Current user, shared through React context |
| `hooks/useAutosave.ts` | Debounced, serialized autosave |
| `pages/` | Login, Signup, Dashboard, DocumentEditor |
| `components/` | Navbar, DocumentRow, EditorWorkspace, EditorToolbar, SaveStatus, ProtectedRoute |

### Data model

| Collection | Fields | Indexes |
|---|---|---|
| `users` | name, email (lowercased), passwordHash, timestamps | unique `email` |
| `sessions` | tokenHash, userId, expiresAt | unique `tokenHash`; TTL on `expiresAt` |
| `documents` | ownerId, title, content (Tiptap JSON), preview, revision, timestamps | `{ ownerId, updatedAt: -1 }` |

### API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account and start a session |
| POST | `/api/auth/login` | Start a session (rate-limited) |
| POST | `/api/auth/logout` | End the session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/documents` | List own documents (summaries, no content) |
| POST | `/api/documents` | Create a document |
| GET | `/api/documents/:id` | Load one own document |
| PATCH | `/api/documents/:id` | Update title and/or content (requires `baseRevision`) |
| DELETE | `/api/documents/:id` | Delete one own document |

## Security decisions

- **Passwords** are hashed with bcrypt (cost 12). Login returns the same error for an unknown email and a wrong password, and runs a hash comparison either way so timing does not reveal which emails exist.
- **Sessions** use a random 32-byte token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production). The database stores only a SHA-256 hash of the token, so a leaked database cannot be used to log in. Logout deletes the session; expired sessions are removed by a TTL index.
- **Authorization**: every document query filters by both the document id and the logged-in user's id. Another user's document, a deleted document, and a malformed id all return the same 404.
- **CSRF**: state-changing requests must carry an `Origin` header that matches the server's host.
- **Login rate limiting**: 10 attempts per IP per 15 minutes.
- **Input validation**: all request bodies are checked with Zod; errors are returned without stack traces or database details.

## How autosave works

1. Each edit marks the document dirty and restarts an 800 ms timer.
2. When the timer fires, one save request is sent with the current title, content, and the last revision the server confirmed.
3. Only one request runs at a time. Edits made during a request mark the document dirty again, and the next save is sent when the current one finishes. An older save can therefore never overwrite a newer one.
4. The server updates the document only if its revision still equals `baseRevision`, and increments the revision in the same atomic operation. Otherwise it responds `409 Conflict` and the editor stops saving and asks the user to reload.
5. "Saved" is shown only when no edits are waiting and no request is in flight.
6. A failed request keeps the edits marked unsaved; the next edit or the Retry button sends them again.
7. Navigating away inside the app first saves pending edits; if that fails, the user is asked to stay or leave. Closing the tab with unsaved edits triggers the browser's leave warning.

## Running locally

Requirements: Node.js 20+ and a MongoDB database (local or a free MongoDB Atlas cluster).

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Configure the server
cd ../server
cp .env.example .env    # then set MONGODB_URI

# 3. Start both apps (two terminals)
cd server && npm run dev   # API on http://localhost:4000
cd client && npm run dev   # App on http://localhost:5173
```

### Environment variables (`server/.env`)

| Variable | Example | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/syncdocs` | Database connection |
| `PORT` | `4000` | Port Express listens on |
| `NODE_ENV` | `development` / `production` | In production, enables secure cookies, proxy trust, and serving the built client |

## Testing

Both test scripts need the app running locally and create throwaway users in the database.

- **API smoke test** (two users, ownership, revision conflicts, validation):
  ```bash
  bash tests/api-smoke.sh http://localhost:4000
  ```
- **End-to-end browser test** (24 checks covering signup, editing, persistence, slow and failed saves, navigation with unsaved edits, rename, delete, cross-user access, logout, and mobile layout):
  ```bash
  cd tests/e2e
  npm install
  npx playwright install chromium
  node journey.mjs http://localhost:5173
  ```

## Deployment

The app deploys as a single Node web service (for example, Render or Railway) plus a MongoDB Atlas database.

- **Build command:** `npm run build` (from the repository root; builds the client and the server)
- **Start command:** `npm start`
- **Environment variables:** `MONGODB_URI`, `NODE_ENV=production` (the platform provides `PORT`)
- **MongoDB Atlas:** allow connections from the host's IP addresses (or `0.0.0.0/0` if the host has no fixed IPs).

## Known limitations

- **One editor per document.** Conflicting edits from two tabs are detected (409), not merged. After a conflict, unsaved edits in that tab are lost when it reloads.
- **Rate limiting is in memory**, so it resets when the server restarts and is not shared between multiple server instances.
- **No password reset or email verification.**
- **If the session expires while editing**, the next save fails and the user is sent to the login page; unsaved edits are lost.
- **Closing the tab** while edits are unsaved shows a browser warning but cannot complete the save.

## Future improvements

- Real-time collaboration with Yjs and Hocuspocus (Yjs document state stored as binary, with authenticated connections)
- Sharing documents with other users and roles (viewer, editor)
- Version history
- Password reset by email
- Running the tests in CI
