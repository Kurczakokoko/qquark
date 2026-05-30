"use client";

import { useEffect, useRef, useState } from "react";
import { QquarkTldraw } from "@/components/canvas/QquarkTldraw";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import type { Editor } from "tldraw";
import {
  createEmptyBoard,
  boardToJsonString,
  boardFromJsonString,
  generateExportFilename,
  loadBoardIntoTldraw,
  exportTldrawToBoard,
} from "@/lib/board";
import type { Board } from "@/lib/board";
import { toast } from "sonner";

/**
 * qquark — Main Application
 *
 * We are building this with care. The goal is a calm, powerful, local-first canvas
 * whose real strength comes from the external AI connector.
 */
export default function QquarkApp() {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isConnectorActive, setIsConnectorActive] = useState(false);

  // Onboarding / Welcome state
  const [showWelcome, setShowWelcome] = useState(true);

  // Simple mobile detection (for PWA prompt + different welcome copy)
  const [isMobile, setIsMobile] = useState(false);

  // PWA install prompt handling
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = navigator.maxTouchPoints ? navigator.maxTouchPoints > 1 : false;
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || isTouch);
    };
    checkMobile();

    // Capture the install prompt event (important for good PWA UX)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      // On iOS Safari we can't programmatically trigger it — user must use Share → Add to Home Screen
      if (isMobile) {
        alert(
          "On iPhone/iPad: Tap the Share button in Safari, then scroll down and choose “Add to Home Screen”."
        );
      }
      return;
    }

    // The beforeinstallprompt event has prompt() and userChoice
    const promptEvent = deferredPrompt as unknown as {
      prompt?: () => void;
      userChoice?: Promise<{ outcome: string }>;
    };
    promptEvent.prompt?.();
    try {
      const result = await promptEvent.userChoice;
      if (result && result.outcome === "accepted") {
        toast.success("Thanks! qquark is now installed.");
      }
    } catch {}
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const handleEditorMount = (ed: Editor) => {
    setEditor(ed);
    loadBoardIntoTldraw(ed, board);
  };

  // === Real Local File Operations (core promise) ===

  const startUsingCanvas = () => {
    setShowWelcome(false);
  };

  const handleNewBoard = () => {
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    if (editor) loadBoardIntoTldraw(editor, newBoard);
    startUsingCanvas();
    toast.success("New board created");
  };

  const handleOpenFile = () => {
    // If we're still on welcome, opening a file should also enter the app
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const loaded = boardFromJsonString(text);
      setBoard(loaded);
      if (editor) loadBoardIntoTldraw(editor, loaded);
      startUsingCanvas();
      toast.success(`Opened "${loaded.name}"`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to open board file");
    }
    e.target.value = "";
  };

  const handleSave = () => {
    if (!editor) {
      toast.error("Canvas not ready");
      return;
    }

    const exportedBoard = exportTldrawToBoard(editor, board);
    setBoard(exportedBoard);

    const json = boardToJsonString(exportedBoard);
    const filename = generateExportFilename(exportedBoard);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Saved as ${filename}`);
  };

  const handleExportToAI = () => {
    if (!editor) return;
    const exported = exportTldrawToBoard(editor, board);
    if (process.env.NODE_ENV === "development") {
      console.log("[qquark] Board exported for AI:", exported);
    }
    toast.info("Full Export to AI experience coming next. Data is prepared.");
  };

  const handleStartConnectorSession = () => {
    const next = !isConnectorActive;
    setIsConnectorActive(next);
    toast(next ? "AI Connector session started (foundational)" : "Session ended");
  };

  // Subtle, high-value keyboard support (no bloat)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, board]); // eslint-disable-line react-hooks/exhaustive-deps


  // When user is still on welcome screen
  if (showWelcome) {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-200">
        <WelcomeScreen
          onStartNew={handleNewBoard}
          onOpenFile={handleOpenFile}
          isMobile={isMobile}
          onInstall={isMobile ? handleInstallPWA : undefined}
          canInstall={canInstall}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.qquark.json"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
    );
  }

  // Main canvas experience
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-200">
      <header className="z-50 flex h-11 items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4 text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="font-semibold tracking-[-0.02em] text-lg">qquark</div>
            <div className="rounded bg-white/5 px-1.5 py-px text-[9px] font-mono text-white/40">
              alpha
            </div>
          </div>
          <div className="text-sm text-white/60 font-medium truncate max-w-[280px]">
            {board.name}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {isConnectorActive && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-emerald-400 mr-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI connected
            </div>
          )}

          <button onClick={handleNewBoard} className="rounded-md border border-white/10 px-2.5 py-1 text-white/60 hover:bg-white/5 active:bg-white/10 transition-colors text-[11px]">
            New
          </button>
          <button onClick={handleOpenFile} className="rounded-md border border-white/10 px-2.5 py-1 text-white/60 hover:bg-white/5 active:bg-white/10 transition-colors text-[11px]">
            Open
          </button>
          <button onClick={handleSave} className="rounded-md border border-white/10 px-2.5 py-1 text-white/60 hover:bg-white/5 active:bg-white/10 transition-colors text-[11px]">
            Save
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={handleExportToAI}
            className="rounded-md bg-white/5 px-2.5 py-1 text-white/70 hover:bg-white/10 active:bg-white/15 transition-colors text-[11px]"
          >
            Export to AI
          </button>
          <button
            onClick={handleStartConnectorSession}
            className="rounded-md bg-blue-600 px-2.5 py-1 font-medium text-white hover:bg-blue-500 active:bg-blue-600 transition-colors text-[11px]"
          >
            {isConnectorActive ? "End AI Session" : "Start AI Session"}
          </button>
        </div>

        <div className="text-[10px] text-white/40 font-mono shrink-0">local • private</div>
      </header>

      <div
        className="relative flex-1 min-h-0 overflow-hidden bg-[#0a0a0a]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (!file) return;

          try {
            const text = await file.text();
            const loaded = boardFromJsonString(text);
            setBoard(loaded);
            if (editor) loadBoardIntoTldraw(editor, loaded);
            toast.success(`Opened "${loaded.name}" via drag & drop`);
          } catch {
            toast.error("Could not open dropped file");
          }
        }}
      >
        <ErrorBoundary>
          <QquarkTldraw onMount={handleEditorMount} />
        </ErrorBoundary>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.qquark.json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="z-50 flex h-5 items-center justify-center border-t border-white/10 bg-[#0a0a0a] text-[10px] text-white/40">
        Boards live as JSON on your device. AI works through the connector protocol.
      </div>
    </div>
  );
}
