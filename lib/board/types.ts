/**
 * qquark — Canonical Board Data Model
 *
 * This is the single source of truth for all board data.
 *
 * Design principles (do not violate):
 * - Boards are strictly local. This model serializes cleanly to JSON files.
 * - The format must be easy for external AI systems to read and generate operations against.
 * - Handwriting (freehand) is first-class because vision-based AI editing is a core differentiator.
 * - Versioned from day one. Never break existing user files without a migration path.
 * - Minimal but complete. No feature bloat.
 * - Stable element IDs across the lifetime of a board.
 */

export type BoardVersion = 1;

export interface Board {
  /** Schema version — always 1 for now */
  version: BoardVersion;

  /** Stable identifier for this board (persists across exports) */
  id: string;

  /** Human-friendly name */
  name: string;

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  /** All elements on the board */
  elements: BoardElement[];

  /**
   * Optional metadata for future extension without breaking the format.
   * Use sparingly. Prefer adding explicit fields when possible.
   */
  meta?: Record<string, unknown> | undefined;
}

/**
 * Discriminated union of all supported element types.
 * Keep this small and well-defined.
 */
export type BoardElement =
  | TextElement
  | ShapeElement
  | ArrowElement
  | FreehandElement
  | ImageElement
  | GroupElement;

/* ========================================================================== */
/* ELEMENT TYPES                                                              */
/* ========================================================================== */

export interface BaseElement {
  id: string; // Stable, unique within the board
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number; // degrees, default 0
  style?: ElementStyle;
  /** For future connector/AI use — never use for core app logic */
  meta?: Record<string, unknown> | undefined;
}

export interface ElementStyle {
  color?: string; // hex or named
  fill?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: "sans" | "serif" | "mono";
  bold?: boolean;
  dashed?: boolean;
}

/* Text --------------------------------------------------------------------- */

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  width: number; // text elements should have explicit width for wrapping
  height?: number;
}

/* Geometric Shapes --------------------------------------------------------- */

export type ShapeType = "rect" | "ellipse" | "diamond" | "note" | "triangle";

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: ShapeType;
  width: number;
  height: number;
}

/* Arrows / Connectors ------------------------------------------------------ */

export interface ArrowElement extends BaseElement {
  type: "arrow";
  width: number;
  height: number;

  /** Optional semantic connection */
  fromId?: string;
  toId?: string;

  label?: string;
  arrowHeadStart?: boolean;
  arrowHeadEnd?: boolean;
}

/* Freehand / Handwriting (Critical for vision AI) -------------------------- */

export interface FreehandElement extends BaseElement {
  type: "freehand";

  /**
   * Stroke points in local element coordinates.
   * Each point can include pressure (0-1) for high quality reconstruction.
   */
  points: Array<{
    x: number;
    y: number;
    pressure?: number;
    timestamp?: number; // relative ms for playback if needed later
  }>;

  /**
   * Whether this was created with a real stylus/pen vs mouse/finger.
   * Important signal for AI when deciding how to interpret handwriting.
   */
  isPen: boolean;

  /**
   * Approximate bounding box (precomputed for performance).
   * Consumers should treat this as authoritative for hit testing.
   */
  width: number;
  height: number;
}

/* Images ------------------------------------------------------------------- */

export interface ImageElement extends BaseElement {
  type: "image";
  width: number;
  height: number;

  /**
   * For local-first: we store either a data URL (small images) or a reference.
   * In v1 we encourage users to keep images small or external.
   * The connector can request the actual pixel data when needed.
   */
  src: string; // data: or https:
  alt?: string;
}

/* Groups ------------------------------------------------------------------- */

export interface GroupElement extends BaseElement {
  type: "group";
  children: string[]; // element IDs belonging to this group
  label?: string;
}

/* ========================================================================== */
/* UTILITY TYPES                                                              */
/* ========================================================================== */

export type ElementType = BoardElement["type"];

export interface BoardViewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * A minimal representation of the current camera/view for export and AI context.
 */
export interface BoardViewState {
  viewport: BoardViewport;
  selectedIds: string[];
}
