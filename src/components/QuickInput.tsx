import { useState, useRef, useEffect } from "react";
import { useNotesStore } from "../store/useNotesStore";

const QuickInput: React.FC = () => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addNote = useNotesStore((s) => s.addNote);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      addNote(trimmed.slice(0, colonIdx).trim(), trimmed.slice(colonIdx + 1).trim());
    } else {
      const words = trimmed.split(/\s+/);
      const title = words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
      addNote(title, trimmed);
    }
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="border-t border-border bg-bg-deep">
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Icon */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex items-center justify-center w-8 h-8 rounded-xl
                     bg-accent text-bg-deep shrink-0
                     hover:bg-accent-hover
                     disabled:opacity-20 disabled:cursor-not-allowed
                     transition-all duration-200 active:scale-90"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New note…  (try  Title: your content)"
          className="flex-1 bg-transparent text-[14px] text-text font-medium
                     placeholder:text-text-faint/50 outline-none"
        />

        {/* Shortcut hint */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded-md bg-surface text-[10px] text-text-faint font-mono border border-border">
            ↵
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default QuickInput;
