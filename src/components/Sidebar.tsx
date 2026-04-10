import { useState, useRef, useCallback } from "react";
import { useNotesStore } from "../store/useNotesStore";
import type { Note } from "../store/useNotesStore";

const Sidebar: React.FC = () => {
  const {
    activeNoteId,
    searchQuery,
    setActiveNote,
    setSearchQuery,
    togglePin,
    deleteNote,
    reorderNotes,
    getFilteredNotes,
  } = useNotesStore();

  const notes = getFilteredNotes();
  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragNode.current = e.currentTarget as HTMLDivElement;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.3";
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      reorderNotes(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNode.current = null;
  }, [dragIndex, dragOverIndex, reorderNotes]);

  const timeLabel = (ts: number): string => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return "now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderNoteItem = (note: Note, globalIndex: number) => {
    const isActive = note.id === activeNoteId;
    const isDragOver = dragOverIndex === globalIndex;

    return (
      <div
        key={note.id}
        draggable
        onDragStart={(e) => handleDragStart(e, globalIndex)}
        onDragOver={(e) => handleDragOver(e, globalIndex)}
        onDragEnd={handleDragEnd}
        onDragLeave={() => setDragOverIndex(null)}
        onClick={() => setActiveNote(note.id)}
        className={`note-item ${isActive ? "active" : ""} ${isDragOver ? "drag-over" : ""}`}
      >
        <div className="note-row">
          <div className="note-title-wrap">
            {note.pinned && (
              <svg className="pin-icon" width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
              </svg>
            )}
            <span className="note-title">{note.title || "Untitled"}</span>
          </div>
          <span className="note-time">{timeLabel(note.updatedAt)}</span>
        </div>

        <p className="note-preview">{note.content.slice(0, 55) || "Empty note"}</p>

        <div className="note-actions">
          <button
            className={`note-action-btn pin ${note.pinned ? "active-pin" : ""}`}
            onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
            </svg>
          </button>
          <button
            className="note-action-btn del"
            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
            title="Delete"
          >
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header" data-tauri-drag-region>
        <div className="sidebar-brand" data-tauri-drag-region>
          <div className="brand-mark">
            <div className="brand-dot" />
            <span className="brand-name">Auranotes</span>
          </div>
          <span className="note-count">{notes.length}</span>
        </div>

        <div className="search-wrap">
          <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="search-input"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="notes-list">
        {pinnedNotes.length > 0 && (
          <>
            <div className="section-label">
              <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--color-pin)", opacity: 0.8 }}>
                <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
              </svg>
              Pinned
            </div>
            {pinnedNotes.map((note) => renderNoteItem(note, notes.indexOf(note)))}
          </>
        )}

        {unpinnedNotes.length > 0 && (
          <>
            {pinnedNotes.length > 0 && (
              <div className="section-label" style={{ marginTop: "6px" }}>Notes</div>
            )}
            {unpinnedNotes.map((note) => renderNoteItem(note, notes.indexOf(note)))}
          </>
        )}

        {notes.length === 0 && (
          <div className="empty-sidebar">
            <div className="empty-icon-box">📝</div>
            <p className="empty-title">{searchQuery ? "Nothing found" : "No notes yet"}</p>
            <p className="empty-sub">
              {searchQuery ? "Try a different search" : "Type below to create your first note"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
