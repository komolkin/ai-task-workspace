# AI Task Workspace

A local-first desktop application (Electron + React + TypeScript) that acts as a visual AI task workspace. Turn messy ideas into clear next actions using AI. The main entity is the **task card**, not a conversation.

## Tech Stack

- **Electron** — desktop shell
- **React** + **TypeScript** — UI
- **Tailwind CSS** — styling (light/dark via OS theme)
- **SQLite** (better-sqlite3) — local persistence
- **@dnd-kit** — Kanban drag-and-drop
- **node-cron** — automation scheduling

## Architecture

- **UI layer** — React only; all data/actions via IPC
- **Task orchestration** — main process: column transitions, AI pipeline, automations
- **Model provider layer** — OpenAI, Anthropic, Ollama, OpenRouter, Mock (no key)
- **Persistence** — SQLite in main process; API keys never sent to renderer

## Setup

```bash
npm install
npm run postinstall   # rebuilds better-sqlite3 for Electron (run if native module errors)
```

## Scripts

- `npm run dev` — start Vite dev server and Electron (HMR)
- `npm run build` — build for production (output: `dist`, `dist-electron`)
- `npm run start` — run built app (`electron .`)

## First Run

- The app seeds the database with example tasks and automations when the DB is empty.
- **Mock provider** is used by default (no API key). Use **Settings** to choose a provider and set an API key.

## Usage

1. **Kanban board** — Five columns: Automations, Inbox, In-progress, To-do, Done. Drag tasks between columns.
2. **Create task** — In **Inbox**, use the form (title + optional description).
3. **AI processing** — Moving a task to **In-progress** runs the AI pipeline (understand → structure → generate → structured result). The card shows a minimal stage indicator. When done, the task moves to **To-do** (your detailed to-do).
4. **To-do** — Click a card in To-do to open the modal (summary, next step, details, checklist). Actions: Edit, Regenerate, Approve → Done, Send to Inbox.
5. **Automations** — In the Automations column, add recurring AI tasks (title, instruction, schedule, output to To-do or Inbox).
6. **Settings** — Provider, default model, API key (stored securely in main process).
7. **Context usage** — Floating panel (bottom-right) shows model context usage.

## OS Theme

The UI follows the system theme (light/dark). Toggle your OS dark mode to see the app update.

## License

MIT
