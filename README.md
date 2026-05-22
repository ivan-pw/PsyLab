# PsyNote

> 🇷🇺 [Русская версия](./README.ru.md)

A local desktop application for psychologists: clients, sessions, notes,
structured anamneses, per-field revision timeline, and full-text search
across everything. All data is stored locally in an encrypted SQLite
database (SQLCipher), protected by a password. No telemetry, no cloud.

Platforms: **macOS**, **Windows**, **Linux**.

---

## Features

- **Clients** — profile with revision history for 6 fields (phone, email,
  messenger, video link, diagnosis, medications). Every change creates a
  new revision, visible on the timeline.
- **Structured anamneses** — 7 subfields (complaints, life history,
  family / somatic / psychiatric history, substance use, notes).
  Multiple snapshots over time.
- **Sessions** — `react-big-calendar` (month / week / day / agenda
  views), colored by status. Mini-calendar in the sidebar.
- **Notes** — colored cards with a configurable palette and text badges.
- **Client timeline** — unified feed: sessions + field revisions +
  anamneses + notes. Filterable by type.
- **Global search** — FTS5 across all entities, with prefix matching and
  snippets. `⌘K` / `Ctrl+K`.
- **i18n** — English and Russian; dictionaries extendable via
  `react-i18next`.
- **Themes** — system / light / dark.
- **Encryption** — SQLCipher, PBKDF2-SHA512 ×250 000 → 32-byte key, salt
  stored in a separate file.
- **Auto-lock** on idle timeout (default 15 minutes).
- **Backups** — manual snapshot to `userData/backups/` with rotation.
- **JSON export** — decrypted dump with an explicit warning dialog.
- **Trash** — soft-delete clients; restore or purge permanently.

## Stack

- Electron 33 + electron-vite + electron-builder
- React 18 + TypeScript (strict)
- SQLite via `better-sqlite3-multiple-ciphers` (SQLCipher-compatible)
- TanStack Query, React Router (Hash), Zustand
- Tailwind CSS + shadcn/ui (Radix UI), lucide-react, sonner
- zod (IPC payload validation)
- vitest

---

## Running from source (dev)

Requirements: **Node ≥ 20**, **pnpm ≥ 10**.

```bash
git clone <repo-url> psynote
cd psynote
pnpm install
pnpm dev
```

`pnpm dev` first rebuilds the native module against the current Electron
(`electron-rebuild -f -w better-sqlite3-multiple-ciphers`), then starts
`electron-vite dev` with renderer HMR.

### System dependencies

| OS | Required |
|---|---|
| macOS | Xcode Command Line Tools (`xcode-select --install`) |
| Windows | Visual Studio Build Tools with the C++ workload, Python 3 |
| Linux | `build-essential`, `python3`, `libsqlite3-dev` (to compile native modules) |

On Linux you may additionally need `libnss3`, `libgbm1`, `libxshmfence1` —
standard Electron runtime dependencies.

### First run

1. You create a password (minimum 6 characters).
2. The database and salt are placed in `app.getPath('userData')` (see
   below).
3. The EULA is shown — without consent the app does not proceed.

---

## Building distributables

```bash
pnpm build       # build main + preload + renderer into out/
pnpm dist:mac    # release/ → .dmg (unsigned)
pnpm dist:win    # release/ → .exe (NSIS, unsigned)
```

Artifacts are written to `release/`. Icons (`icon.png` / `icon.ico` /
`icon.icns`) live in [`resources/`](./resources/). Code signing (Apple
Developer ID / Windows code-signing) is a separate step, not done in the
MVP.

---

## Installing the built app

### macOS (`.dmg`)

The distributable is not signed by an Apple Developer ID and is not
notarized, so Gatekeeper will block the first launch with one of:

- "PsyNote can't be opened because the developer cannot be verified", or
- "PsyNote is damaged and can't be opened" (when the file arrived via
  AirDrop / a download / an archive — Apple marks it with the quarantine
  attribute).

**Easiest fix** — after dragging `PsyNote.app` into `/Applications/`:

```bash
xattr -dr com.apple.quarantine /Applications/PsyNote.app
codesign --force --deep --sign - /Applications/PsyNote.app
```

The first command strips the quarantine xattr (the "is damaged" message
goes away). The second performs a local ad-hoc signature (no certificate
needed) — after that the app launches without right-click workarounds.

**Alternative, GUI-only**:

1. Right-click `PsyNote.app` → "Open" → click "Open" again in the
   dialog.
2. If no such option appears — System Settings → Privacy & Security →
   scroll down to "PsyNote was blocked" → "Open Anyway".

This GUI path does not work for the "is damaged" message — use the
Terminal command above instead.

### Windows (`.exe`, NSIS installer)

SmartScreen will show "Windows protected your PC". Click "More info" →
"Run anyway".

The installer creates a Start menu shortcut (and optionally a desktop
shortcut).

### Linux

`electron-builder` supports `AppImage` / `deb` / `rpm` targets. Linux
targets are not configured in the current `electron-builder.yml` — add
them manually as needed, then:

```bash
pnpm build && pnpm exec electron-builder --linux
```

Running an AppImage:

```bash
chmod +x PsyNote-*.AppImage
./PsyNote-*.AppImage
```

---

## Where the data is stored

The standard `app.getPath('userData')` directory:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/psynote/` |
| Windows | `%APPDATA%\psynote\` (usually `C:\Users\<user>\AppData\Roaming\psynote\`) |
| Linux | `~/.config/psynote/` |

Contents:

- `psynote.db` — encrypted SQLite (SQLCipher).
- `psynote.salt` — 16-byte salt for PBKDF2. **Without it the key cannot
  be derived from the password.**
- `psynote.db-wal` / `psynote.db-shm` — SQLite write-ahead log /
  shared-memory files.
- `backups/psynote-<ISO>.db` (+ paired `*.salt`) — manual snapshots.

No data is ever sent anywhere — no cloud, no telemetry.

---

## Backups and export

- **Backup** — Settings → "Create backup". Copies `psynote.db` +
  `psynote.salt` into `userData/backups/`. Rotated by count.
- **JSON export** — Settings → "Export to JSON". A warning dialog is
  shown first, then a system "Save As". The resulting file is a
  decrypted dump of all tables + `schema_version` + `generated_at`.
  Useful for migration or hand inspection. **Store it only in a secure
  location and delete it after use.**

---

## Tests and checks

```bash
pnpm typecheck      # tsc for main + renderer
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm test           # vitest run
pnpm test:watch
```

---

## Project layout

```
src/
├── main/           # Electron main: window, IPC, DB, migrations, backups
│   ├── ipc/        # per-domain handlers (auth/clients/notes/...)
│   ├── db/         # connection, migrator, migrations, repositories
│   └── services/   # crypto, backup, exportJson
├── preload/        # contextBridge → window.api
├── shared/         # shared types, zod schemas, api contract
└── renderer/       # React app
    ├── pages/      # Unlock, ClientsList, ClientDetail, Calendar, Settings
    ├── components/ # Layout, Timeline, ClientFields, Notes, Settings, …
    ├── hooks/      # useClients, useMeetings, useAnamneses, useNotes, …
    ├── api/        # wrappers over window.api
    ├── lib/        # utils, format, i18n, queryClient
    ├── store/      # zustand (auth, theme, locale)
    └── locales/    # ru.json, en.json
```

---

## Security

- The database is encrypted with SQLCipher; the key is derived from the
  password using PBKDF2-SHA512 with 250 000 iterations.
- The salt lives in a separate file (`psynote.salt`) next to
  `psynote.db`. Without it the database file is useless.
- The password is never stored anywhere. **Password recovery is
  impossible — losing the password means losing the data.**
- Auto-lock on idle timeout.
- JSON export is the only unencrypted output and requires explicit
  confirmation.

---

## License

[PolyForm Small Business License 1.0.0](./LICENSE) with an additional
restriction: free use is granted only when staff ≤ 1 person **and**
annual revenue ≤ $30,000. Any other use requires a separate agreement
with the rights holder. Full terms — see [LICENSE](./LICENSE).
