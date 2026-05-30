/**
 * qquark — Tldraw Bridge / Adapter
 *
 * This is a critical translation layer.
 *
 * Responsibilities:
 * - Convert our clean, portable, AI-friendly `BoardElement` model into tldraw shapes
 * - Convert tldraw shapes back into our canonical model for export and the connector protocol
 *
 * This must be:
 * - As lossless as possible in both directions
 * - Defensive (tldraw shapes can be weird)
 * - Easy to extend as we support more element types
 *
 * In the long term, when we introduce Yjs, this layer will also help us keep
 * the canonical representation in sync with the CRDT.
 */

import type { Editor, TLShape, TLShapeId } from "tldraw";
import type { Board, BoardElement, TextElement, ShapeElement, FreehandElement } from "./types";
import { nanoid } from "nanoid";

/**
 * Load a canonical Board into the tldraw editor.
 * This replaces whatever is currently on the page.
 */
export function loadBoardIntoTldraw(editor: Editor, board: Board) {
  // Clear current page (careful — in the future we'll support multiple pages)
  const existingShapes = editor.getCurrentPageShapes();

  if (existingShapes.length > 0) {
    editor.deleteShapes(existingShapes.map((s) => s.id));
  }

  // Convert and create
  const tldrawShapes: TLShape[] = [];

  for (const element of board.elements) {
    const shape = elementToTldrawShape(element);
    if (shape) {
      tldrawShapes.push(shape);
    }
  }

  if (tldrawShapes.length > 0) {
    editor.createShapes(tldrawShapes);
  }

  // Future: restore camera / viewport from board if we store it
}

/**
 * Convert a single canonical element into a tldraw shape (best effort).
 */
function elementToTldrawShape(element: BoardElement): TLShape | null {
  const base = {
    id: `shape:${element.id}` as TLShapeId,
    typeName: "shape" as const,
    x: element.x,
    y: element.y,
    rotation: (element.rotation || 0) * (Math.PI / 180),
    isLocked: false,
    opacity: element.style?.opacity ?? 1,
  };

  switch (element.type) {
    case "text": {
      const el = element as TextElement;
      return {
        ...base,
        type: "text",
        props: {
          text: el.text,
          fontSize: el.style?.fontSize ?? 20,
          color: "black",
          // More props can be mapped here
        },
      } as unknown as TLShape;
    }

    case "shape": {
      const el = element as ShapeElement;
      return {
        ...base,
        type: el.shapeType === "rect" ? "rectangle" : el.shapeType, // rough mapping
        props: {
          w: el.width,
          h: el.height,
          color: "black",
        },
      } as unknown as TLShape;
    }

    case "freehand": {
      const el = element as FreehandElement;
      // tldraw's draw shape is powerful. We map our points into it.
      return {
        ...base,
        type: "draw",
        props: {
          segments: [
            {
              type: "free",
              points: el.points.map((p) => ({
                x: p.x,
                y: p.y,
                z: p.pressure ?? 0.5,
              })),
            },
          ],
          color: "black",
          size: "m",
          isPen: el.isPen,
        },
      } as unknown as TLShape;
    }

    // We will add arrow, image, group mappings carefully
    default:
      return null;
  }
}

/**
 * Export the current state of the tldraw editor back into our canonical Board format.
 * This is what powers "Save" and the connector protocol.
 */
export function exportTldrawToBoard(editor: Editor, existingBoard?: Partial<Board>): Board {
  const shapes = editor.getCurrentPageShapes();
  const elements: BoardElement[] = [];

  for (const shape of shapes) {
    const el = tldrawShapeToElement(shape);
    if (el) elements.push(el);
  }

  const now = new Date().toISOString();

  return {
    version: 1,
    id: existingBoard?.id ?? nanoid(10),
    name: existingBoard?.name ?? "Untitled Board",
    createdAt: existingBoard?.createdAt ?? now,
    updatedAt: now,
    elements,
  };
}

function tldrawShapeToElement(shape: TLShape): BoardElement | null {
  const id = shape.id.replace("shape:", "");

  const base = {
    id,
    x: shape.x,
    y: shape.y,
    rotation: ((shape.rotation || 0) * 180) / Math.PI,
  };

  switch (shape.type) {
    case "text": {
      const props = shape.props as unknown as Record<string, unknown>;
      return {
        ...base,
        type: "text",
        text: (props.text as string) ?? "",
        width: (props.w as number) ?? 200,
      } as TextElement;
    }

    case "draw": {
      const props = shape.props as unknown as Record<string, unknown>;
      const segments = (props.segments as unknown[]) ?? [];
      const points: Array<{ x: number; y: number; pressure: number | undefined }> = [];

      for (const seg of segments) {
        const segPoints = (((seg as Record<string, unknown>)?.points as unknown[]) ?? []);
        for (const p of segPoints) {
          const point = p as Record<string, unknown>;
          points.push({
            x: (point.x as number) ?? 0,
            y: (point.y as number) ?? 0,
            pressure: point.z as number | undefined,
          });
        }
      }

      return {
        ...base,
        type: "freehand",
        points,
        isPen: Boolean(props.isPen),
        width: (props.w as number) ?? 100,
        height: (props.h as number) ?? 100,
      } as FreehandElement;
    }

    // Shapes we don't yet map are intentionally dropped during export.
    // This is a known limitation while we expand the bridge.
    // In the future we should either support them or preserve them as opaque blobs.
    default:
      if (process.env.NODE_ENV === "development") {
        console.warn("[qquark bridge] Unmapped shape type dropped on export:", shape.type);
      }
      return null;
  }
}
