"use client";

import { useCallback, useRef, useState } from "react";
import { Tldraw, type Editor } from "tldraw";
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

      // Start in draw tool — this feels right for a whiteboard
      editor.setCurrentTool("draw");

      // Future work (very important):
      // - Load canonical board data into the store
      // - Set up proper camera restoration
      // - Bind to Yjs when in a collaborative session

      if (onMount) {
        onMount(editor);
      }

      // Light change listener (we'll make this smarter later)
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
    <div className="absolute inset-0 bg-[#0f0f0f] overflow-hidden">
      <Tldraw
        onMount={handleMount}
        hideUi={true}
        persistenceKey="qquark-local-cache"
      />
    </div>
  );
}
