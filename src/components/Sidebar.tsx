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

  // Drag state
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
        className={`
          group relative px-4 py-3 mx-2 rounded-xl cursor-pointer
          transition-all duration-200 ease-out mb-0.5
          ${isDragOver ? "border-t-2 border-accent" : "border-t-2 border-transparent"}
          ${
            isActive
              ? "bg-surface-active"
              : "hover:bg-surface-hover"
          }
        `}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-accent" />
        )}

        {/* Title row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {note.pinned && (
              <svg className="w-3.5 h-3.5 text-pin shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
              </svg>
            )}
            <span
              className={`text-[14px] font-semibold truncate leading-tight ${
                isActive ? "text-text" : "text-text-secondary"
              }`}
            >
              {note.title || "Untitled"}
            </span>
          </div>
          <span className="text-[11px] text-text-faint ml-2 shrink-0 font-mono">
            {timeLabel(note.updatedAt)}
          </span>
        </div>

        {/* Preview */}
        <p className="text-[12px] text-text-muted truncate leading-relaxed pl-0">
          {note.content.slice(0, 60) || "Empty note"}
        </p>

        {/* Hover actions */}
        <div className="absolute top-2.5 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              note.pinned ? "text-pin" : "text-text-faint hover:text-accent"
            } hover:bg-surface`}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
            className="p-1.5 rounded-lg text-text-faint hover:text-danger hover:bg-danger-dim transition-all duration-200"
            title="Delete"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[240px] h-full flex flex-col bg-bg-deep border-r border-border shrink-0">
      {/* ─── Header ─── */}
      <div data-tauri-drag-region className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4" data-tauri-drag-region>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-accent animate-glow" />
            <h1 className="text-[18px] font-bold tracking-tight text-text">
              Auranotes
            </h1>
          </div>
          <span className="text-[12px] text-text-faint font-mono bg-surface px-2 py-0.5 rounded-md">
            {notes.length}
          </span>
        </div>

        {/* ─── Search ─── */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface text-[13px] text-text
                       placeholder:text-text-faint border border-border
                       focus:border-accent/30 focus:outline-none
                       transition-all duration-200"
          />
        </div>
      </div>

      {/* ─── Notes List ─── */}
      <div className="flex-1 overflow-y-auto py-1">
        {pinnedNotes.length > 0 && (
          <>
            <div className="px-5 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-faint">
                📌 Pinned
              </span>
            </div>
            {pinnedNotes.map((note) => renderNoteItem(note, notes.indexOf(note)))}
          </>
        )}

        {unpinnedNotes.length > 0 && (
          <>
            {pinnedNotes.length > 0 && (
              <div className="px-5 py-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-faint">
                  All Notes
                </span>
              </div>
            )}
            {unpinnedNotes.map((note) => renderNoteItem(note, notes.indexOf(note)))}
          </>
        )}

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-[14px] font-semibold text-text-muted mb-1">
              {searchQuery ? "Nothing found" : "No notes yet"}
            </p>
            <p className="text-[12px] text-text-faint leading-relaxed">
              {searchQuery ? "Try a different query" : "Start typing below to create your first note"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
