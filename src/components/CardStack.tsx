import { useState, useRef, useCallback, useEffect } from "react";
import { useNotesStore } from "../store/useNotesStore";

const SWIPE_THRESHOLD = 100;
const TAP_THRESHOLD = 8;
const ROTATION_FACTOR = 0.12;

const CardStack: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    setActiveNote,
    setEditorOpen,
    deleteNote,
    currentCardIndex,
    setCurrentCardIndex,
    getFilteredNotes,
    undoNote,
    undoDelete,
  } = useNotesStore();

  const notes = getFilteredNotes();
  const totalNotes = notes.length;

  // Swipe state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyDirection, setFlyDirection] = useState<"left" | "right" | null>(null);
  const [flyingNoteId, setFlyingNoteId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const totalDragDist = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset after fly animation completes
  useEffect(() => {
    if (flyDirection && flyingNoteId) {
      const timer = setTimeout(() => {
        setFlyDirection(null);
        setFlyingNoteId(null);
        setDragOffset({ x: 0, y: 0 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [flyDirection, flyingNoteId]);

  // Clamp card index when notes change
  useEffect(() => {
    if (currentCardIndex >= totalNotes && totalNotes > 0) {
      setCurrentCardIndex(totalNotes - 1);
    }
  }, [totalNotes, currentCardIndex, setCurrentCardIndex]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    totalDragDist.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = (e.clientY - dragStart.current.y) * 0.3;
      totalDragDist.current = Math.abs(dx) + Math.abs(e.clientY - dragStart.current.y);
      setDragOffset({ x: dx, y: dy });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const currentNote = notes[currentCardIndex];
    if (!currentNote) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    const wasTap = totalDragDist.current < TAP_THRESHOLD;

    if (wasTap) {
      // It was a tap, not a swipe — open editor
      setDragOffset({ x: 0, y: 0 });
      setActiveNote(currentNote.id);
      setEditorOpen(true);
      return;
    }

    if (dragOffset.x < -SWIPE_THRESHOLD) {
      // Swipe LEFT → Delete
      setFlyDirection("left");
      setFlyingNoteId(currentNote.id);
      setTimeout(() => {
        deleteNote(currentNote.id);
      }, 250);
    } else if (dragOffset.x > SWIPE_THRESHOLD) {
      // Swipe RIGHT → Open editor
      setFlyDirection("right");
      setFlyingNoteId(currentNote.id);
      setTimeout(() => {
        setActiveNote(currentNote.id);
        setEditorOpen(true);
        setFlyDirection(null);
        setFlyingNoteId(null);
        setDragOffset({ x: 0, y: 0 });
      }, 250);
    } else {
      // Spring back
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, dragOffset.x, notes, currentCardIndex, deleteNote, setActiveNote, setEditorOpen]);

  const timeLabel = (ts: number): string => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && totalNotes > 0) {
        e.preventDefault();
        setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
      } else if (e.key === "ArrowRight" && totalNotes > 0) {
        e.preventDefault();
        setCurrentCardIndex(Math.min(totalNotes - 1, currentCardIndex + 1));
      } else if (e.key === "Enter" && totalNotes > 0 && !e.ctrlKey) {
        const note = notes[currentCardIndex];
        if (note) {
          setActiveNote(note.id);
          setEditorOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalNotes, currentCardIndex, notes, setCurrentCardIndex, setActiveNote, setEditorOpen]);

  // Swipe indicator opacity
  const swipeOpacity = Math.min(Math.abs(dragOffset.x) / SWIPE_THRESHOLD, 1);
  const isSwipingLeft = dragOffset.x < -20;
  const isSwipingRight = dragOffset.x > 20;

  return (
    <div className="card-area">
      {/* Search + counter row — always present, always same position */}
      <div className="card-top-bar">
        <div className="card-search-wrap">
          <svg className="card-search-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes…"
            className="card-search-input"
          />
        </div>
        {totalNotes > 0 && (
          <div className="card-counter">
            <span className="card-counter-current">{currentCardIndex + 1}</span>
            <span className="card-counter-sep">/</span>
            <span className="card-counter-total">{totalNotes}</span>
          </div>
        )}
      </div>

      {totalNotes === 0 ? (
        /* Empty state */
        <div className="card-empty">
          <div className="card-empty-glow" />
          <div className="card-empty-icon">✦</div>
          <h2 className="card-empty-title">
            {searchQuery ? "No matches" : "Your deck is empty"}
          </h2>
          <p className="card-empty-sub">
            {searchQuery
              ? "Try a different search term"
              : "Create your first note below to get started"}
          </p>
          {!searchQuery && (
            <div className="card-empty-hint">
              <span className="hint-kbd">Ctrl+N</span>
              <span className="hint-label">Quick create</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Swipe indicators */}
          <div className={`swipe-indicator swipe-delete ${isSwipingLeft ? "visible" : ""}`} style={{ opacity: isSwipingLeft ? swipeOpacity : 0 }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Delete</span>
          </div>
          <div className={`swipe-indicator swipe-open ${isSwipingRight ? "visible" : ""}`} style={{ opacity: isSwipingRight ? swipeOpacity : 0 }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Open</span>
          </div>

          {/* Card stack */}
          <div className="card-stack">
            {notes.slice(currentCardIndex, currentCardIndex + 3).map((note, i) => {
              const isTop = i === 0;
              const isFlying = note.id === flyingNoteId;
              const scale = 1 - i * 0.04;
              const yOffset = i * 10;

              // Only apply fly/drag transforms to the card that's actually being swiped
              const tx = isFlying
                ? flyDirection === "left" ? -600
                : flyDirection === "right" ? 600
                : dragOffset.x
                : isTop && isDragging
                ? dragOffset.x
                : 0;
              const ty = isFlying
                ? (isDragging ? dragOffset.y : 0)
                : isTop && isDragging
                ? dragOffset.y
                : isTop ? 0 : yOffset;
              const rotate = (isFlying || (isTop && isDragging)) ? tx * ROTATION_FACTOR : 0;
              const cardOpacity = isFlying
                ? flyDirection ? 0 : 1
                : 1 - i * 0.15;

              return (
                <div
                  key={note.id}
                  ref={isTop ? cardRef : undefined}
                  className={`note-card ${isTop ? "top-card" : ""} ${isTop && isDragging ? "dragging" : ""}`}
                  style={{
                    transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg) scale(${scale})`,
                    opacity: cardOpacity,
                    zIndex: 10 - i,
                    transition: (isDragging && isTop) || isFlying ? "none" : "transform 0.3s ease-out, opacity 0.25s ease-out",
                  }}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerUp : undefined}
                >
                  {/* Card color accent based on swipe direction */}
                  {isTop && (
                    <div
                      className="card-swipe-tint"
                      style={{
                        background: isSwipingLeft
                          ? `rgba(255, 90, 126, ${swipeOpacity * 0.12})`
                          : isSwipingRight
                          ? `rgba(184, 240, 74, ${swipeOpacity * 0.12})`
                          : "transparent",
                      }}
                    />
                  )}

                  {/* Pinned badge */}
                  {note.pinned && (
                    <div className="card-pin-badge">
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
                      </svg>
                      <span>Pinned</span>
                    </div>
                  )}

                  <div className="card-header">
                    <h3 className="card-title">{note.title || "Untitled"}</h3>
                    <span className="card-time">{timeLabel(note.updatedAt)}</span>
                  </div>

                  <div className="card-divider" />

                  <p className="card-content">
                    {note.content || "Empty note — tap to start writing"}
                  </p>

                  <div className="card-footer">
                    <span className="card-date">
                      {new Date(note.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="card-words">
                      {note.content.trim() ? note.content.trim().split(/\s+/).length : 0} words
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation dots */}
          {totalNotes > 1 && (
            <div className="card-nav">
              <button
                className="card-nav-btn"
                onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                disabled={currentCardIndex === 0}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <div className="card-dots">
                {notes.slice(0, Math.min(totalNotes, 7)).map((_, i) => (
                  <button
                    key={i}
                    className={`card-dot ${i === currentCardIndex ? "active" : ""}`}
                    onClick={() => setCurrentCardIndex(i)}
                  />
                ))}
                {totalNotes > 7 && <span className="card-dots-more">+{totalNotes - 7}</span>}
              </div>

              <button
                className="card-nav-btn"
                onClick={() => setCurrentCardIndex(Math.min(totalNotes - 1, currentCardIndex + 1))}
                disabled={currentCardIndex === totalNotes - 1}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}

          {/* Swipe hint */}
          <div className="swipe-hint">
            <span className="swipe-hint-item hint-delete">← delete</span>
            <span className="swipe-hint-divider">·</span>
            <span className="swipe-hint-item">tap to edit</span>
            <span className="swipe-hint-divider">·</span>
            <span className="swipe-hint-item hint-open">open →</span>
          </div>
        </>
      )}

      {/* Undo toast */}
      {undoNote && (
        <div className="undo-toast">
          <span className="undo-toast-text">
            Deleted "<strong>{undoNote.title || "Untitled"}</strong>"
          </span>
          <button className="undo-toast-btn" onClick={undoDelete}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
};

export default CardStack;

