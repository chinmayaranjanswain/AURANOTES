import { useState, useEffect, useRef, useCallback } from "react";
import { useNotesStore } from "../store/useNotesStore";

const NoteEditorOverlay: React.FC = () => {
  const {
    editorOpen,
    setEditorOpen,
    activeNoteId,
    updateNote,
    togglePin,
    deleteNote,
    getActiveNote,
  } = useNotesStore();

  const note = getActiveNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note && editorOpen) {
      setTitle(note.title);
      setContent(note.content);
      setIsClosing(false);
    }
  }, [activeNoteId, editorOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleClose = () => {
    // Force save before closing
    if (activeNoteId && (title !== note?.title || content !== note?.content)) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      updateNote(activeNoteId, { title, content });
    }
    setIsClosing(true);
    setTimeout(() => {
      setEditorOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const handleDelete = () => {
    if (!note) return;
    setIsClosing(true);
    setTimeout(() => {
      deleteNote(note.id);
      setEditorOpen(false);
      setIsClosing(false);
    }, 280);
  };

  // Escape key to close
  useEffect(() => {
    if (!editorOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editorOpen, handleClose]);

  if (!editorOpen || !note) return null;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const dateStr = new Date(note.createdAt).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`overlay-backdrop ${isClosing ? "closing" : ""}`} onClick={handleClose}>
      <div
        className={`overlay-panel ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Overlay toolbar */}
        <div className="overlay-toolbar">
          <button className="overlay-close-btn" onClick={handleClose} title="Close (Esc)">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <span className="overlay-date">{dateStr}</span>

          <div className="overlay-actions">
            <button
              onClick={() => togglePin(note.id)}
              className={`overlay-tool-btn ${note.pinned ? "pinned" : ""}`}
              title={note.pinned ? "Unpin" : "Pin"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
              </svg>
            </button>

            <button onClick={handleDelete} className="overlay-tool-btn danger" title="Delete note">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Editor body */}
        <div className="overlay-body">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="overlay-title"
            autoFocus
          />
          <div className="overlay-title-rule" />
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your thoughts…"
            className="overlay-content"
            spellCheck={false}
          />
        </div>

        {/* Status bar */}
        <div className="overlay-statusbar">
          <div className="overlay-saved">
            <div className="overlay-dot" />
            <span className="overlay-saved-text">Auto-saved</span>
          </div>
          <span className="overlay-word-count">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NoteEditorOverlay;
