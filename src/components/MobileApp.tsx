import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNotesStore } from "../store/useNotesStore";
import { THEMES, applyTheme, getStoredThemeId } from "./SettingsPanel";
import type { Theme } from "./SettingsPanel";
import {
  RefreshCw,
  ArrowUpRight,
  FileText,
  Plus,
  Search,
  Menu,
  Pin,
  Trash2,
  X,
  ChevronLeft,
  Check,
  Moon,
  Sun,
  Palette,
  Link2,
  ExternalLink,
} from "lucide-react";

/* ───── Relative-time helper ───── */
function timeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ───── Tab type ───── */
type MobileTab = "notes" | "capture" | "search" | "menu";

/* ───── Swipe-to-Delete wrapper ───── */
function SwipeToDelete({
  onDelete,
  children,
}: {
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offset, setOffset] = useState(0);
  const [removing, setRemoving] = useState(false);
  const threshold = 100; // px to trigger delete

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    swiping.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    currentX.current = e.touches[0].clientX;
    const dx = currentX.current - startX.current;
    // Only allow swipe left (negative)
    if (dx < 0) {
      setOffset(dx);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    swiping.current = false;
    if (offset < -threshold) {
      // Animate out then delete
      setRemoving(true);
      setTimeout(() => onDelete(), 300);
    } else {
      // Snap back
      setOffset(0);
    }
  }, [offset, onDelete]);

  const deleteProgress = Math.min(Math.abs(offset) / threshold, 1);

  return (
    <div
      className={`m-swipe-container ${removing ? "m-swipe-removing" : ""}`}
      ref={containerRef}
    >
      {/* Red delete zone behind */}
      <div
        className="m-swipe-delete-zone"
        style={{ opacity: deleteProgress }}
      >
        <Trash2 size={18} style={{ opacity: deleteProgress }} />
        <span style={{ opacity: deleteProgress > 0.4 ? 1 : 0 }}>DELETE</span>
      </div>

      {/* The sliding card */}
      <div
        className="m-swipe-card"
        style={{
          transform: removing
            ? "translateX(-100%)"
            : `translateX(${offset}px)`,
          transition: swiping.current ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   📱 MobileApp — Full-featured hacker PWA
   ═══════════════════════════════════════════════════════ */
export default function MobileApp() {
  const {
    notes,
    initialize,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    getFilteredNotes,
    setSearchQuery,
    undoNote,
    undoDelete,
  } = useNotesStore();

  const [activeTab, setActiveTab] = useState<MobileTab>("capture");
  const [inputText, setInputText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commitFlash, setCommitFlash] = useState(false);

  // Note detail view
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Settings / themes
  const [activeThemeId, setActiveThemeId] = useState(getStoredThemeId());

  // Search
  const [localSearch, setLocalSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── Bootstrap ── */
  useEffect(() => {
    initialize();
    const themeId = getStoredThemeId();
    const theme = THEMES.find((t) => t.id === themeId);
    if (theme) applyTheme(theme);
  }, [initialize]);

  /* ── PWA Web Share Target ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedTitle = params.get("title");
    const sharedText = params.get("text");
    const sharedUrl = params.get("url");
    const content = [sharedTitle, sharedText, sharedUrl].filter(Boolean).join("\n\n");
    if (content) {
      addNote(sharedTitle || "Shared Note", content);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addNote]);

  /* ── Focus search input when switching to search tab ── */
  useEffect(() => {
    if (activeTab === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  /* ── Refresh ── */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await initialize();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [initialize]);

  /* ── Smart title extraction ──
     Priority: 1) >> delimiter  2) First short sentence  3) First 2-3 words */
  const extractTitle = useCallback((text: string): { title: string; content: string } => {
    // 1) Explicit delimiter: "My Title >> the rest is content"
    const delimIdx = text.indexOf(">>");
    if (delimIdx !== -1) {
      const title = text.slice(0, delimIdx).trim().replace(/^[:•\-\*#>]+\s*/, "").trim();
      const content = text.slice(delimIdx + 2).trim();
      return {
        title: title || "Quick note",
        content: content || text,
      };
    }

    // 2) Smart extraction from first line
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return { title: "Quick note", content: text };

    let firstLine = lines[0].trim();
    // Strip leading special chars
    firstLine = firstLine.replace(/^[:•\-\*#>]+\s*/, "").trim();

    // If first line is very short, use next line
    if (firstLine.length < 3 && lines.length > 1) {
      firstLine = lines[1].trim().replace(/^[:•\-\*#>]+\s*/, "").trim();
    }

    // If first line is short enough (< 50 chars), use it as-is
    let title = firstLine;
    if (title.length > 50) {
      // Take first 2-3 meaningful words
      const words = title.split(/\s+/);
      title = words.slice(0, 3).join(" ");
      if (words.length > 3) title += "…";
    }

    if (!title) title = "Quick note";
    const content = lines.length > 1 ? lines.slice(1).join("\n") : text;
    return { title, content };
  }, []);

  /* ── Live auto-title preview ── */
  const autoTitlePreview = useMemo(() => {
    if (!inputText.trim()) return null;
    return extractTitle(inputText.trim()).title;
  }, [inputText, extractTitle]);

  /* ── Extract links from all notes ── */
  const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+/gi;
  const extractedLinks = useMemo(() => {
    const links: { url: string; domain: string; noteTitle: string; noteId: string }[] = [];
    const seen = new Set<string>();
    for (const note of notes) {
      const text = `${note.title}\n${note.content}`;
      const matches = text.matchAll(URL_REGEX);
      for (const match of matches) {
        let url = match[0];
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        if (seen.has(url)) continue;
        seen.add(url);
        let domain = url;
        try { domain = new URL(url).hostname.replace("www.", ""); } catch {}
        links.push({ url, domain, noteTitle: note.title || "Untitled", noteId: note.id });
      }
    }
    return links;
  }, [notes]);

  /* ── Commit ── */
  const handleCommit = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const { title, content } = extractTitle(text);
    addNote(title, content);
    setInputText("");
    setCommitFlash(true);
    setTimeout(() => setCommitFlash(false), 400);
  }, [inputText, addNote, extractTitle]);

  /* ── Open note detail ── */
  const openNote = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setViewingNoteId(id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }, [notes]);

  /* ── Save & close note detail ── */
  const closeNoteDetail = useCallback(() => {
    if (viewingNoteId) {
      const note = notes.find((n) => n.id === viewingNoteId);
      if (note && (editTitle !== note.title || editContent !== note.content)) {
        updateNote(viewingNoteId, { title: editTitle, content: editContent });
      }
    }
    setViewingNoteId(null);
  }, [viewingNoteId, editTitle, editContent, notes, updateNote]);

  /* ── Theme selection ── */
  const handleThemeSelect = useCallback((theme: Theme) => {
    setActiveThemeId(theme.id);
    applyTheme(theme);
  }, []);

  /* ── Search handler ── */
  const handleSearchChange = useCallback((query: string) => {
    setLocalSearch(query);
    setSearchQuery(query);
  }, [setSearchQuery]);

  const filteredNotes = getFilteredNotes();
  const viewingNote = viewingNoteId ? notes.find((n) => n.id === viewingNoteId) : null;

  /* ═══════════════════════════════════════
     NOTE DETAIL OVERLAY
     ═══════════════════════════════════════ */
  if (viewingNote) {
    return (
      <div className="m-shell">
        {/* Detail Header */}
        <header className="m-detail-header">
          <button onClick={closeNoteDetail} className="m-back-btn">
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <div className="m-detail-actions">
            <button
              onClick={() => togglePin(viewingNote.id)}
              className={`m-detail-action-btn ${viewingNote.pinned ? "m-pinned" : ""}`}
            >
              <Pin size={18} />
            </button>
            <button
              onClick={() => { deleteNote(viewingNote.id); setViewingNoteId(null); }}
              className="m-detail-action-btn m-danger"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        {/* Detail Body */}
        <div className="m-detail-body">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Note title..."
            className="m-detail-title"
          />
          <div className="m-detail-meta">
            <span>{new Date(viewingNote.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>{viewingNote.content.split(/\s+/).filter(Boolean).length} words</span>
            {viewingNote.pinned && <span className="m-detail-pin-badge">📌 Pinned</span>}
          </div>
          <div className="m-detail-divider" />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Write your note..."
            className="m-detail-content"
          />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     MAIN APP SHELL
     ═══════════════════════════════════════ */
  return (
    <div className="m-shell">
      {/* ═══ HEADER (shared across all tabs) ═══ */}
      <header className="m-header">
        <div className="m-header-row">
          <h1 className="m-brand">AURANOTES</h1>
          <button
            onClick={handleRefresh}
            className="m-icon-btn"
            aria-label="Refresh"
          >
            <RefreshCw size={18} className={isRefreshing ? "m-spin" : ""} />
          </button>
        </div>
        <div className="m-status-bar">
          <div className="m-status-left">
            <span className="m-sys-label">SYSTEM_NODE</span>
            <span className="m-sys-value">local::aura-input-01</span>
          </div>
          <div className="m-status-right">
            <span className="m-sys-label">STATUS</span>
            <span className="m-status-dot" />
            <span className="m-status-live">listening</span>
          </div>
        </div>
      </header>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="m-content">
        {/* ───── NOTES TAB ───── */}
        {activeTab === "notes" && (
          <div className="m-tab-notes">
            <div className="m-section-title">
              <span>ALL NOTES</span>
              <span className="m-count-badge">{notes.length}</span>
            </div>
            {notes.length === 0 ? (
              <div className="m-empty">
                <span className="m-empty-icon">📝</span>
                <span className="m-empty-title">No notes yet</span>
                <span className="m-empty-sub">Tap CAPTURE to create your first note</span>
              </div>
            ) : (
              <div className="m-notes-scroll">
                {filteredNotes.map((note) => (
                  <SwipeToDelete key={note.id} onDelete={() => deleteNote(note.id)}>
                    <button
                      className="m-card-premium"
                      onClick={() => openNote(note.id)}
                    >
                      {/* Top row: pin + time */}
                      <div className="m-card-top-row">
                        {note.pinned ? (
                          <span className="m-card-pin-label"><Pin size={10} /> Pinned</span>
                        ) : (
                          <span />
                        )}
                        <span className="m-card-time-label">{timeSince(note.updatedAt)}</span>
                      </div>
                      {/* Title */}
                      <h3 className="m-card-serif-title">{note.title || "Untitled"}</h3>
                      {/* Accent bar */}
                      <div className="m-card-accent-bar" />
                      {/* Content preview */}
                      <p className="m-card-body-preview">
                        {note.content.slice(0, 120) || "No content"}
                      </p>
                      {/* Footer */}
                      <div className="m-card-footer-row">
                        <span className="m-card-word-count">
                          {note.content.split(/\s+/).filter(Boolean).length} words
                        </span>
                      </div>
                    </button>
                  </SwipeToDelete>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ───── CAPTURE TAB ───── */}
        {activeTab === "capture" && (
          <div className="m-tab-capture">
            {/* ── Links extracted from notes ── */}
            {extractedLinks.length > 0 && (
              <div className="m-carousel-section">
                <div className="m-carousel-header">
                  <Link2 size={12} className="m-carousel-link-icon" />
                  <span className="m-carousel-label">LINKS</span>
                  <span className="m-carousel-count">{extractedLinks.length}</span>
                </div>
                <div className="m-carousel-track">
                  {extractedLinks.slice(0, 10).map((link, i) => (
                    <button
                      key={`${link.noteId}-${i}`}
                      className="m-link-card"
                      onClick={() => window.open(link.url, "_blank", "noopener")}
                    >
                      <div className="m-link-card-icon">
                        {link.domain.charAt(0).toUpperCase()}
                      </div>
                      <span className="m-link-card-domain">{link.domain}</span>
                      <div className="m-link-card-from">
                        <span>from {link.noteTitle}</span>
                        <ExternalLink size={10} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Spacer to push input to thumb zone ── */}
            <div className="m-capture-spacer" />

            {/* ── Clean input area (bottom / thumb zone) ── */}
            <div className="m-input-section">
              {/* Auto-title preview */}
              {autoTitlePreview && (
                <div className="m-autotitle-preview">
                  <span className="m-autotitle-label">TITLE →</span>
                  <span className="m-autotitle-value">{autoTitlePreview}</span>
                </div>
              )}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What's on your mind?"
                className="m-input-clean"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {/* Hint */}
              <div className="m-input-hint">
                tip: use <strong>&gt;&gt;</strong> to set a custom title — <em>"My Title &gt;&gt; note body"</em>
              </div>
              <button
                onClick={handleCommit}
                disabled={!inputText.trim()}
                className={`m-commit-btn ${commitFlash ? "m-commit-flash" : ""}`}
              >
                <span>COMMIT NOTE</span>
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* ───── SEARCH TAB ───── */}
        {activeTab === "search" && (
          <div className="m-tab-search">
            <div className="m-search-bar">
              <Search size={16} className="m-search-icon" />
              <input
                ref={searchInputRef}
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search notes..."
                className="m-search-input"
                autoComplete="off"
              />
              {localSearch && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="m-search-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {localSearch ? (
              <div className="m-search-results">
                <span className="m-search-count">
                  {filteredNotes.length} result{filteredNotes.length !== 1 ? "s" : ""}
                </span>
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    className="m-note-card"
                    onClick={() => openNote(note.id)}
                  >
                    <div className="m-note-card-left">
                      <div className="m-note-card-info">
                        <h3 className="m-note-card-title">{note.title || "Untitled"}</h3>
                        <p className="m-note-card-preview">
                          {note.content.slice(0, 80) || "No content"}
                        </p>
                      </div>
                    </div>
                    <span className="m-note-card-time">{timeSince(note.updatedAt)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="m-empty">
                <Search size={36} className="m-empty-search-icon" />
                <span className="m-empty-title">Search your notes</span>
                <span className="m-empty-sub">Find notes by title or content</span>
              </div>
            )}
          </div>
        )}

        {/* ───── MENU / SETTINGS TAB ───── */}
        {activeTab === "menu" && (
          <div className="m-tab-menu">
            {/* Theme section */}
            <div className="m-menu-section">
              <div className="m-menu-section-header">
                <Palette size={14} />
                <span>APPEARANCE</span>
              </div>

              {/* Dark themes */}
              <div className="m-theme-group">
                <div className="m-theme-group-label">
                  <Moon size={12} />
                  <span>Dark Themes</span>
                </div>
                <div className="m-theme-grid">
                  {THEMES.filter((t) => t.mode === "dark").map((theme) => (
                    <button
                      key={theme.id}
                      className={`m-theme-card ${activeThemeId === theme.id ? "m-theme-active" : ""}`}
                      onClick={() => handleThemeSelect(theme)}
                    >
                      <div
                        className="m-theme-preview"
                        style={{ background: theme.colors.bg }}
                      >
                        <div
                          className="m-theme-preview-inner"
                          style={{
                            background: theme.colors.surface,
                            borderColor: theme.colors.border,
                          }}
                        >
                          <div
                            className="m-theme-accent-bar"
                            style={{ background: theme.colors.accent }}
                          />
                          <div
                            className="m-theme-text-line"
                            style={{ background: theme.colors.textFaint }}
                          />
                          <div
                            className="m-theme-text-line short"
                            style={{ background: theme.colors.textFaint }}
                          />
                        </div>
                      </div>
                      <span className="m-theme-name">{theme.name}</span>
                      {activeThemeId === theme.id && (
                        <div className="m-theme-check" style={{ background: theme.colors.accent }}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Light themes */}
              <div className="m-theme-group">
                <div className="m-theme-group-label">
                  <Sun size={12} />
                  <span>Light Themes</span>
                </div>
                <div className="m-theme-grid">
                  {THEMES.filter((t) => t.mode === "light").map((theme) => (
                    <button
                      key={theme.id}
                      className={`m-theme-card ${activeThemeId === theme.id ? "m-theme-active" : ""}`}
                      onClick={() => handleThemeSelect(theme)}
                    >
                      <div
                        className="m-theme-preview"
                        style={{ background: theme.colors.bg }}
                      >
                        <div
                          className="m-theme-preview-inner"
                          style={{
                            background: theme.colors.surface,
                            borderColor: theme.colors.border,
                          }}
                        >
                          <div
                            className="m-theme-accent-bar"
                            style={{ background: theme.colors.accent }}
                          />
                          <div
                            className="m-theme-text-line"
                            style={{ background: theme.colors.textFaint }}
                          />
                          <div
                            className="m-theme-text-line short"
                            style={{ background: theme.colors.textFaint }}
                          />
                        </div>
                      </div>
                      <span className="m-theme-name">{theme.name}</span>
                      {activeThemeId === theme.id && (
                        <div className="m-theme-check" style={{ background: theme.colors.accent }}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="m-menu-section">
              <div className="m-menu-section-header">
                <span>ABOUT</span>
              </div>
              <div className="m-about-card">
                <span className="m-about-title">Auranotes</span>
                <span className="m-about-version">v0.1.0 · PWA</span>
                <span className="m-about-desc">A hacker-aesthetic note-taking PWA. Built with React, Zustand & Supabase.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ UNDO TOAST ═══ */}
      {undoNote && (
        <div className="m-undo-toast">
          <span className="m-undo-text">Deleted "<strong>{undoNote.title}</strong>"</span>
          <button onClick={undoDelete} className="m-undo-btn">UNDO</button>
        </div>
      )}

      {/* ═══ BOTTOM NAV ═══ */}
      <nav className="m-bottom-nav">
        <button
          className={`m-nav-item ${activeTab === "notes" ? "m-nav-active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <FileText size={20} />
          <span className="m-nav-label">NOTES</span>
        </button>

        <button
          className={`m-nav-item m-nav-center ${activeTab === "capture" ? "m-nav-center-active" : ""}`}
          onClick={() => setActiveTab("capture")}
        >
          <div className="m-nav-ring">
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <span className="m-nav-label m-nav-label-accent">CAPTURE</span>
        </button>

        <button
          className={`m-nav-item ${activeTab === "search" ? "m-nav-active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          <Search size={20} />
          <span className="m-nav-label">SEARCH</span>
        </button>

        <button
          className={`m-nav-item ${activeTab === "menu" ? "m-nav-active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          <Menu size={20} />
          <span className="m-nav-label">MENU</span>
        </button>
      </nav>
    </div>
  );
}
