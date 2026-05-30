# qquark Connector Protocol

**Status:** Draft (v0.1)

The connector protocol is the most important part of qquark. It allows external AI chatbots (Grok, Claude, ChatGPT, etc.) that the user already trusts and pays for to read from and write to a local qquark board in a controlled, high-quality way.

## Philosophy

- The AI stays outside. qquark never calls LLMs.
- The user explicitly starts a connector session and shares a token.
- The protocol must be reliable enough that the AI can do real work with minimal hallucination.
- Handwriting / vision is a first-class use case. The ability for the AI to request screenshots of specific regions is deliberate and powerful.
- The protocol should feel natural to prompt with.

## Core Concepts

### Connector Session
A time-limited, user-initiated session tied to a specific board/room. The user generates a token and gives it to their AI once.

### Capabilities
- `read_state` — Read current elements (full or filtered)
- `capture_screenshot` — Request a high-quality image of a specific region (critical for handwriting)
- `apply_operations` — Make precise, atomic changes to the board
- `get_view_state` — Current viewport + selection

The AI works step-by-step. Each operation or screenshot request is a discrete action that the user can see happening on the canvas.

## Export / Read Format

When the AI calls for the current board state, it receives a clean JSON document matching the canonical `Board` model defined in `lib/board/types.ts`.

Key characteristics:
- Stable element IDs
- Explicit `freehand` elements with pressure data when available
- Groups as first-class containers
- Connections expressed via `fromId` / `toId` on arrows

## Operations (Write / Edit)

The AI responds with an array of operations. All operations are designed to be:

- Idempotent where possible
- Safe to apply in batch
- Easy to validate and reject if malformed

### Supported Operations (v0.1)

```ts
type Operation =
  | { op: "add_text"; id?: string; x: number; y: number; text: string; style?: Partial<ElementStyle> }
  | { op: "add_shape"; id?: string; type: "rect" | "ellipse" | "diamond" | "note"; x: number; y: number; width: number; height: number; style?: Partial<ElementStyle> }
  | { op: "add_arrow"; id?: string; fromId?: string; toId?: string; x?: number; y?: number; label?: string }
  | { op: "add_freehand"; id?: string; points: Array<{x: number; y: number; pressure?: number}>; x: number; y: number; isPen?: boolean }
  | { op: "move"; ids: string[]; dx: number; dy: number }
  | { op: "resize"; id: string; width: number; height: number; x?: number; y?: number }
  | { op: "update_text"; id: string; text: string }
  | { op: "connect"; from: string; to: string; label?: string }
  | { op: "delete"; ids: string[] }
  | { op: "group"; ids: string[]; groupId?: string }
  | { op: "ungroup"; groupId: string }
  | { op: "set_style"; ids: string[]; style: Partial<ElementStyle> };
```

### Screenshot Requests (Vision)

This is one of qquark's differentiators.

The AI can request:

```json
{
  "action": "capture_region",
  "rect": { "x": 1200, "y": 800, "width": 600, "height": 400 },
  "scale": 2,
  "reason": "Read the handwriting in this cluster"
}
```

The browser renders the exact region at high quality and returns a base64 PNG (or URL) back to the AI via the relay. This allows the AI to actually *see* rough sketches and handwriting that would be impossible to parse from structured data alone.

## Example Prompt the User Can Give Their AI

```
You are controlling a qquark whiteboard via its connector protocol.

Current session token: qk_abc123xyz

When you need to understand the board:
1. Call get_current_state
2. If you see handwriting or ambiguous drawings, use capture_region on the specific area with scale 2 or higher.

You work step by step. After each meaningful change, briefly tell the user what you did.

Supported operations are documented at https://... (we will host a clean version).

Never guess coordinates. Ask for the current state first if you are unsure.
```

## Security & Trust Model

- Sessions are short-lived by default.
- The user sees active connector sessions in the UI and can terminate them instantly.
- The relay never stores the actual board content — it only forwards commands and screenshot payloads.
- All operations go through validation on the client before being applied.

## Future Evolution

- Operation batching + transactions
- Streaming change subscriptions for the AI
- Fine-grained permission scopes per token
- Better handwriting stroke reconstruction hints

---

**This document is the contract.** Any change to the protocol must be reflected here and in the TypeScript types under `lib/connector/`.
