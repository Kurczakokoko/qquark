"use client";

interface WelcomeScreenProps {
  onStartNew: () => void;
  onOpenFile: () => void;
  isMobile: boolean;
  onInstall?: (() => void) | undefined;
  canInstall?: boolean;
}

export function WelcomeScreen({ onStartNew, onOpenFile, isMobile, onInstall, canInstall }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="max-w-md">
        {/* Logo / Name */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="font-semibold tracking-[-0.04em] text-6xl text-white">qquark</div>
        </div>

        <p className="mb-8 text-lg text-zinc-400 leading-relaxed">
          A minimal, local-first infinite whiteboard.
          <br />
          Your boards are just files on your device. 
          Connect your own AI (Grok, Claude, ChatGPT...) to read and edit them intelligently.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onStartNew}
            className="w-full rounded-xl bg-white py-3.5 text-lg font-medium text-black active:bg-zinc-200 transition-colors"
          >
            Start a new board
          </button>

          <button
            onClick={onOpenFile}
            className="w-full rounded-xl border border-white/20 py-3.5 text-lg font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            Open a board from file
          </button>
        </div>

        {/* Mobile install prompt - this is important for good iPad experience */}
        {isMobile && onInstall && (
          <button
            onClick={onInstall}
            className="mt-4 w-full rounded-xl border border-white/30 bg-white/5 py-3 text-sm font-medium text-white active:bg-white/10 transition-colors"
          >
            {canInstall ? "Install qquark for best experience" : "Add to Home Screen (recommended)"}
          </button>
        )}

        {/* Connector explanation */}
        <div className="mt-10 text-left">
          <div className="text-xs uppercase tracking-[1px] text-zinc-500 mb-2">The real power</div>
          <div className="text-sm text-zinc-400 leading-relaxed">
            Click <span className="font-medium text-white">“Start AI Session”</span> and give your chatbot a token. 
            It can then read the current board (including screenshots of your handwriting) and make precise edits live — 
            all without us ever touching an LLM.
          </div>
        </div>

        {isMobile && (
          <div className="mt-8 text-xs text-zinc-500">
            Best with Apple Pencil or stylus. Finger is for panning.
          </div>
        )}
      </div>
    </div>
  );
}
