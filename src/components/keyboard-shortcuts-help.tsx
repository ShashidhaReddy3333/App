"use client";

import { useState } from "react";
import { useKeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcut";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Ctrl", "Enter"], description: "Complete sale / Submit form" },
  { keys: ["Escape"], description: "Cancel / Close dialog" },
  { keys: ["F1"], description: "Focus search field" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useKeyboardShortcut("?", () => setOpen((prev) => !prev));
  useKeyboardShortcut("Escape", () => setOpen(false), { enabled: open });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-lg transition-colors hover:bg-muted"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-50 w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
        <div className="mt-4 space-y-3">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOpen(false)}
          className="mt-6 w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Close
        </button>
      </div>
    </div>
  );
}
