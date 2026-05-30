/**
 * qquark — Board Serialization
 *
 * Responsible for turning the canonical in-memory Board model into clean,
 * portable JSON files and back again.
 *
 * This layer is critical. It must be:
 * - Extremely reliable (users will version these files in git)
 * - Lossless for supported element types
 * - Defensive against bad data (especially from AI-generated operations)
 */

import { nanoid } from "nanoid";
import type { Board, BoardElement } from "./types";

const CURRENT_VERSION = 1 as const;

export interface SerializedBoard {
  version: typeof CURRENT_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  elements: BoardElement[];
  meta?: Record<string, unknown> | undefined;
}

/**
 * Create a brand new empty board.
 */
export function createEmptyBoard(name = "Untitled Board"): Board {
  const now = new Date().toISOString();
  return {
    version: CURRENT_VERSION,
    id: nanoid(10),
    name,
    createdAt: now,
    updatedAt: now,
    elements: [],
  };
}

/**
 * Validate and normalize a board coming from disk or from an AI.
 * This is intentionally strict but forgiving on minor issues.
 */
export function validateAndNormalizeBoard(input: unknown): Board {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid board: not an object");
  }

  const raw = input as Partial<SerializedBoard>;

  if (raw.version !== CURRENT_VERSION) {
    // Future: add migration paths here
    throw new Error(`Unsupported board version: ${raw.version}`);
  }

  if (!raw.id || !raw.name || !Array.isArray(raw.elements)) {
    throw new Error("Invalid board: missing required fields");
  }

  // Normalize elements — filter out anything obviously broken
  const elements = raw.elements
    .filter((el): el is BoardElement => {
      if (!el || typeof el !== "object" || !("id" in el) || !("type" in el)) {
        return false;
      }
      return true;
    })
    .map(normalizeElement);

  const now = new Date().toISOString();

  return {
    version: CURRENT_VERSION,
    id: raw.id,
    name: raw.name,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    elements,
    meta: raw.meta ?? undefined,
  };
}

function normalizeElement(el: BoardElement): BoardElement {
  // Basic defensive normalization — expand this carefully over time
  if (el.type === "freehand" && !el.points) {
    return { ...el, points: [] } as BoardElement;
  }
  return el;
}

/**
 * Prepare a board for writing to disk as clean JSON.
 * This is what users will save, git, and share.
 */
export function serializeBoardForExport(board: Board): SerializedBoard {
  return {
    version: CURRENT_VERSION,
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    updatedAt: new Date().toISOString(),
    elements: board.elements,
    meta: board.meta ?? undefined,
  };
}

/**
 * Convert a Board into a pretty JSON string ready for download.
 */
export function boardToJsonString(board: Board): string {
  const serialized = serializeBoardForExport(board);
  return JSON.stringify(serialized, null, 2);
}

/**
 * Parse a JSON string (from file or drag-and-drop) into a validated Board.
 */
export function boardFromJsonString(json: string): Board {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Failed to parse board JSON");
  }
  return validateAndNormalizeBoard(parsed);
}

/**
 * Generate a safe filename for export.
 */
export function generateExportFilename(board: Board): string {
  const safeName = board.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${safeName || "board"}-${date}.qquark.json`;
}
