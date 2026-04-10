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
    <div className="quick-input-bar">
      <div className="quick-input-inner">
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="quick-add-btn"
          title="Add note"
        >
          +
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New note…  try  Title: your content"
          className="quick-input-field"
        />

        <span className="quick-enter-hint">↵</span>
      </div>
    </div>
  );
};

export default QuickInput;
