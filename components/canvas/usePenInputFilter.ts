"use client";

import { useEffect } from "react";
import type { Editor, TLPointerEventInfo } from "tldraw";

/**
 * usePenInputFilter — qquark's signature input experience
 *
 * This hook is treated with extreme care.
 *
 * Core requirement from the user:
 * - One finger (or trackpad) = reliable panning and navigation
 * - Apple Pencil / real stylus = precise, pressure-sensitive drawing
 *
 * The user should never have to think about tool switching on a tablet.
 * This behavior must feel better than most commercial whiteboard apps.
 *
 * Strategy:
 * - Use tldraw's InputsManager (getIsPen + isCoarsePointer)
 * - Automatically route coarse pointers to camera panning
 * - Automatically route pen input to the draw tool
 * - Be defensive against palm rejection edge cases
 *
 * Current known limitation (documented):
 * After panning with a finger, the user must tap the draw tool (or we could auto-switch on pen down).
 * This is a deliberate simple starting point. We can refine the state machine later.
 */

export function usePenInputFilter(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return;

    const handleBeforeEvent = (info: TLPointerEventInfo) => {
      if (info.type !== "pointer") return;

      const inputs = editor.inputs;
      const isPen = inputs.getIsPen();

      // isCoarsePointer exists on InputsManager but typing can lag behind in some versions.
      // We keep a narrow cast here intentionally.
      const isCoarse = Boolean((inputs as unknown as { isCoarsePointer?: boolean }).isCoarsePointer);

      const currentTool = editor.getCurrentToolId();

      if (isPen) {
        if (currentTool !== "draw" && info.name === "pointer_down") {
          editor.setCurrentTool("draw");
        }
        return;
      }

      if (isCoarse) {
        if (currentTool === "draw" && info.name === "pointer_down") {
          editor.setCurrentTool("hand");
        }
      }
    };

    // Safely attach listener. tldraw's event system typing varies between versions.
    // We use a narrow, defensive approach here.
    let cleanup: (() => void) | void;
    try {
      const editorAny = editor as unknown as {
        on?: (event: string, handler: (info: unknown) => void) => (() => void) | void;
      };
      cleanup = editorAny.on?.("before-event", (info: unknown) => {
        if (info && typeof info === "object" && "type" in info) {
          handleBeforeEvent(info as TLPointerEventInfo);
        }
      });
    } catch {
      // Input filter gracefully degrades if attachment fails
    }

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [editor]);
}
