import { useEffect, useState } from "react";
import { useNotesStore } from "./store/useNotesStore";

/* ── Desktop components (existing) ── */
import CardStack from "./components/CardStack";
import LinksPanel from "./components/LinksPanel";
import SettingsPanel, { THEMES, applyTheme, getStoredThemeId } from "./components/SettingsPanel";
import NoteEditorOverlay from "./components/NoteEditorOverlay";
import QuickInput from "./components/QuickInput";

/* ── Mobile component ── */
import MobileApp from "./components/MobileApp";

type Tab = "cards" | "links" | "settings";

/**
 * 🚦 THE TRAFFIC COP
 * Detects whether we're running inside Tauri (desktop) or a plain browser (mobile PWA)
 * and routes to the correct UI shell.
 */
function App() {
  const initialize = useNotesStore((s) => s.initialize);
  const syncStatus = useNotesStore((s) => s.syncStatus);
  const [activeTab, setActiveTab] = useState<Tab>("cards");
  const [platform, setPlatform] = useState<"desktop" | "mobile" | null>(null);

  useEffect(() => {
    // Detect Tauri — if __TAURI_INTERNALS__ exists, we're in the desktop shell
    const isTauri = !!(window as any).__TAURI_INTERNALS__;
    setPlatform(isTauri ? "desktop" : "mobile");
  }, []);

  useEffect(() => {
    if (platform === "desktop") {
      initialize();
      const themeId = getStoredThemeId();
      const theme = THEMES.find((t) => t.id === themeId);
      if (theme) applyTheme(theme);
    }
    // Mobile initializes itself inside MobileApp
  }, [initialize, platform]);

  /* ── Still detecting platform ── */
  if (platform === null) {
    return (
      <div style={{
        width: "100%",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0b08",
        color: "#A6E22E",
        fontFamily: "monospace",
        fontSize: 14,
      }}>
        <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
          INITIALIZING...
        </span>
      </div>
    );
  }

  /* ══════════════════════════════════════
     📱 MOBILE PWA ROUTE
     ══════════════════════════════════════ */
  if (platform === "mobile") {
    return <MobileApp />;
  }

  /* ══════════════════════════════════════
     🖥️ DESKTOP (TAURI) ROUTE
     ══════════════════════════════════════ */
  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      getCurrentWindow().close();
    } catch {
      window.close();
    }
  };

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      getCurrentWindow().minimize();
    } catch {}
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const maximized = await win.isMaximized();
      maximized ? win.unmaximize() : win.maximize();
    } catch {}
  };

  const syncColor =
    syncStatus === "syncing" ? "#f59e0b" :
    syncStatus === "error"   ? "#ef4444" :
    syncStatus === "synced"  ? "#10b981" : "transparent";

  const syncLabel =
    syncStatus === "syncing" ? "⏳ Syncing…" :
    syncStatus === "error"   ? "⚠️ Offline" :
    syncStatus === "synced"  ? "☁️ Synced" : "";

  return (
    <div className="app-shell">
      {/* Draggable titlebar */}
      <div className="titlebar" data-tauri-drag-region>
        <div className="titlebar-left" data-tauri-drag-region>
          <svg className="brand-logo" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#starGrad)" />
            <defs>
              <radialGradient id="starGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff8cb0" />
                <stop offset="100%" stopColor="#e8507a" />
              </radialGradient>
            </defs>
          </svg>
          <span className="titlebar-title" data-tauri-drag-region>Auranotes</span>
        </div>

        {/* Tab switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === "cards" ? "active" : ""}`}
            onClick={() => setActiveTab("cards")}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
            Cards
          </button>
          <button
            className={`tab-btn ${activeTab === "links" ? "active" : ""}`}
            onClick={() => setActiveTab("links")}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-1.135a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.21" />
            </svg>
            Links
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>

        <div className="titlebar-controls">
          {syncLabel && (
            <button 
              className="sync-badge refresh-btn" 
              style={{ 
                color: syncColor, 
                background: "transparent", 
                border: "none", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: "6px",
                fontFamily: "inherit",
                fontSize: "inherit"
              }}
              onClick={() => initialize()}
              title="Click to force sync with server"
            >
              <span>{syncLabel}</span>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ 
                  animation: syncStatus === "syncing" ? "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none" 
                }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-5.46-5.46"/>
                <path d="M2.5 22v-6h6M2.66 8.43a10 10 0 1 1 .59 9.21l5.46 5.46"/>
              </svg>
            </button>
          )}
          <button className="titlebar-btn minimize" onClick={handleMinimize} title="Minimize" />
          <button className="titlebar-btn maximize" onClick={handleMaximize} title="Maximize" />
          <button className="titlebar-btn close" onClick={handleClose} title="Close" />
        </div>
      </div>

      {/* Main content */}
      <div className="app-main">
        {activeTab === "cards" && <CardStack />}
        {activeTab === "links" && <LinksPanel />}
        {activeTab === "settings" && <SettingsPanel />}
      </div>

      {/* Quick input bar at bottom */}
      <QuickInput />

      {/* Editor overlay */}
      <NoteEditorOverlay />
    </div>
  );
}

export default App;
