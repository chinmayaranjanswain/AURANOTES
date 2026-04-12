import { useMemo } from "react";
import { useNotesStore } from "../store/useNotesStore";

interface ExtractedLink {
  url: string;
  displayUrl: string;
  domain: string;
  noteTitle: string;
  noteId: string;
  context: string;
}

// Catches http(s) URLs, www.xxx, and bare domain.tld/path patterns
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|org|net|io|dev|co|me|app|xyz|info|tech|ai|gg|tv|cc|us|uk|in|edu|gov|mil|ly|to|it|de|fr|ru|jp|br|au|ca|nl|se|no|fi|be|at|ch|es|pt|pl|cz|sk|hu|ro|bg|hr|si|ee|lv|lt)(?:\/[^\s<>"{}|\\^`[\]]*)?/gi;

function normalizeUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function getPath(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path === "/" ? "" : path;
  } catch {
    return "";
  }
}

// Generate a consistent color from domain string
function domainColor(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 55%)`;
}

const LinksPanel: React.FC = () => {
  const notes = useNotesStore((s) => s.notes);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const setEditorOpen = useNotesStore((s) => s.setEditorOpen);

  const links = useMemo(() => {
    const result: ExtractedLink[] = [];

    for (const note of notes) {
      const text = `${note.title}\n${note.content}`;
      const matches = text.matchAll(URL_REGEX);

      for (const match of matches) {
        const rawUrl = match[0];
        const url = normalizeUrl(rawUrl);
        const domain = getDomain(url);
        const idx = match.index ?? 0;

        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + rawUrl.length + 50);
        let context = text.slice(start, end).replace(/\n/g, " ").trim();
        if (start > 0) context = "…" + context;
        if (end < text.length) context = context + "…";

        result.push({
          url,
          displayUrl: rawUrl,
          domain,
          noteTitle: note.title || "Untitled",
          noteId: note.id,
          context,
        });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return result.filter((link) => {
      if (seen.has(link.url)) return false;
      seen.add(link.url);
      return true;
    });
  }, [notes]);

  const openLink = async (url: string) => {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
    } catch {
      // Fallback for web dev mode
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const goToNote = (noteId: string) => {
    setActiveNote(noteId);
    setEditorOpen(true);
  };

  if (links.length === 0) {
    return (
      <div className="links-panel">
        <div className="links-empty">
          <div className="links-empty-icon">🔗</div>
          <h2 className="links-empty-title">No links found</h2>
          <p className="links-empty-sub">
            Add URLs to your notes and they'll be collected here automatically
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="links-panel">
      <div className="links-header">
        <div className="links-header-left">
          <h2 className="links-title">Collected Links</h2>
          <span className="links-count">{links.length}</span>
        </div>
      </div>

      <div className="links-list">
        {links.map((link, i) => {
          const color = domainColor(link.domain);
          const initial = link.domain.charAt(0).toUpperCase();
          const path = getPath(link.url);

          return (
            <div key={`${link.noteId}-${i}`} className="link-card">
              {/* Main clickable area */}
              <button className="link-card-main" onClick={() => openLink(link.url)}>
                {/* Domain icon */}
                <div className="link-icon" style={{ background: `${color}18`, color }}>
                  {initial}
                </div>

                <div className="link-details">
                  <span className="link-domain">{link.domain}</span>
                  {path && <span className="link-path">{path}</span>}
                </div>

                <svg className="link-arrow" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </button>

              {/* Context preview */}
              <div className="link-context">
                <p className="link-context-text">"{link.context}"</p>
              </div>

              {/* Source note */}
              <button className="link-source" onClick={() => goToNote(link.noteId)}>
                <div className="link-source-dot" />
                <span>{link.noteTitle}</span>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LinksPanel;
