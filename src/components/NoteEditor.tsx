import { useState, useEffect, useRef, useCallback } from "react";
import { useNotesStore } from "../store/useNotesStore";

const NoteEditor: React.FC = () => {
  const { activeNoteId, updateNote, togglePin, deleteNote, getActiveNote } =
    useNotesStore();

  const note = getActiveNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [activeNoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!activeNoteId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateNote(activeNoteId, { title: newTitle, content: newContent });
      }, 300);
    },
    [activeNoteId, updateNote]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    autoSave(val, content);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    autoSave(title, val);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // ──── Empty State ────
  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-surface flex items-center justify-center mb-5 animate-glow">
          <span className="text-4xl">✍️</span>
        </div>
        <h2 className="text-[20px] font-bold text-text mb-2">
          Start Writing
        </h2>
        <p className="text-[14px] text-text-muted mb-4 max-w-[240px] leading-relaxed">
          Select a note from the sidebar or create a new one below
        </p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border">
          <kbd className="px-2 py-0.5 rounded-md bg-bg text-accent text-[12px] font-mono font-bold">
            Ctrl+N
          </kbd>
          <span className="text-[13px] text-text-muted">Quick create</span>
        </div>
      </div>
    );
  }

  const dateStr = new Date(note.createdAt).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ──── Editor ────
  return (
    <div className="flex-1 flex flex-col bg-bg animate-fade-in">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <span className="text-[12px] text-text-faint">{dateStr}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePin(note.id)}
            className={`p-2 rounded-xl transition-all duration-200 ${
              note.pinned
                ? "text-pin bg-accent-dim"
                : "text-text-faint hover:text-text hover:bg-surface"
            }`}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
            </svg>
          </button>

          <button
            onClick={() => deleteNote(note.id)}
            className="p-2 rounded-xl text-text-faint hover:text-danger hover:bg-danger-dim transition-all duration-200"
            title="Delete note"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Editor Area ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 selectable">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full text-[24px] font-bold text-text bg-transparent
                     placeholder:text-text-faint/40 outline-none mb-1
                     tracking-tight leading-tight"
        />

        {/* Subtle separator */}
        <div className="w-12 h-[2px] bg-accent/30 rounded-full mb-4" />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your thoughts..."
          className="w-full h-full min-h-[280px] text-[15px] text-text-secondary leading-[1.9]
                     bg-transparent placeholder:text-text-faint/25
                     outline-none resize-none"
          spellCheck={false}
        />
      </div>

      {/* ─── Status Bar ─── */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
          <span className="text-[11px] text-text-faint">Saved</span>
        </div>
        <span className="text-[11px] text-text-faint font-mono">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
};

export default NoteEditor;
