# qquark

**A minimal, local-first, open-source collaborative infinite whiteboard that gets its real power from external AI chatbots via a clean connector protocol.**

## Philosophy (Non-Negotiable)

- Extremely minimal core. No feature bloat.
- Boards are strictly local — stored as JSON files on your device. Primary persistence is file export/import.
- No central database owns your whiteboards.
- All serious AI work happens outside the app through connectors to *your* subscriptions (Grok, Claude, ChatGPT, etc.).
- Designed first for personal + small trusted groups.
- Fast, simple, and expandable through the connector protocol.

## The Connector (The Important Part)

qquark's killer feature is the ability for your existing AI chatbots to:

1. Read the current board state (structured + optional filtered subsets).
2. Request high-quality screenshots of **any specific region** — this is deliberately powerful for vision models reading handwriting and rough sketches.
3. Apply precise, step-by-step edits that appear live on the canvas.
4. Work like a collaborator (visible actions, natural pacing).

You start a connector session, give your chatbot a token, and it can control the board with high reliability.

See `docs/connector-protocol.md` for the current specification.

## Current Status

This is early, high-quality foundation work.

- Canonical board data model + lossless JSON serialization (`lib/board`)
- Live connector protocol types + validation (`lib/connector`)
- Next.js 16 + tldraw + Yjs + PartyKit prepared
- Excellent mobile + Apple Pencil support is a priority (finger pan, pen draw)
- Real-time multiplayer and the live AI connector are the next major verticals

## Getting Started (Developers)

```bash
npm install
npm run dev
```

## Tech

- Next.js 16 (Vercel)
- tldraw (Hobby license)
- Yjs + PartyKit for real-time + connector relay
- Strict TypeScript + Zod for protocol safety

## License

MIT (with tldraw under its Hobby license terms).

---

Built with care. Boards belong to you. AI stays where you already trust it.
