"use client";

import { useCallback, useRef, useState } from "react";
import { Tldraw, type Editor, DefaultColorStyle } from "tldraw";
import { usePenInputFilter } from "./usePenInputFilter";

/**
 * QquarkTldraw
 *
 * The core infinite canvas wrapper.
 *
 * This component is treated with care because input quality (especially on iPad + Apple Pencil)
 * is one of the primary user experience differentiators for qquark.
 */

interface QquarkTldrawProps {
  onMount?: (editor: Editor) => void;
  onChange?: (editor: Editor) => void;
}

export function QquarkTldraw({ onMount, onChange }: QquarkTldrawProps) {
  const editorRef = useRef<Editor | null>(null);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  // The pen input filter is one of our highest priority pieces of UX code
  usePenInputFilter(editorInstance);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      setEditorInstance(editor);

      // Force dark mode that matches the rest of qquark
      editor.user.updateUserPreferences({ colorScheme: 'dark' });

      // Default drawing color to white so it looks good on dark background immediately
      editor.setStyleForNextShapes(DefaultColorStyle, 'white');

      // Start in draw tool
      editor.setCurrentTool("draw");

      // Future work:
      // - Load canonical board data into the store
      // - Set up proper camera restoration
      // - Bind to Yjs when in a collaborative session

      if (onMount) {
        onMount(editor);
      }

      const unsubscribe = editor.store.listen(() => {
        if (onChange && editorRef.current) {
          onChange(editorRef.current);
        }
      });

      return () => {
        unsubscribe();
      };
    },
    [onMount, onChange]
  );

  return (
    <div className="h-full w-full bg-[#0a0a0a]">
      <Tldraw
        onMount={handleMount}
        // We show tldraw's UI so the board is actually usable.
        // Dark theme + white default stroke is configured in handleMount.
        persistenceKey="qquark-local-cache"
      />
    </div>
  );
}
