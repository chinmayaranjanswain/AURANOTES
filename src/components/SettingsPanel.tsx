import { useEffect, useState } from "react";

export interface Theme {
  id: string;
  name: string;
  mode: "dark" | "light";
  colors: {
    bg: string;
    bgDeep: string;
    bgPanel: string;
    surface: string;
    surfaceHover: string;
    surfaceActive: string;
    border: string;
    borderSoft: string;
    accent: string;
    accentHover: string;
    accentDim: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textFaint: string;
    danger: string;
    pin: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: "midnight-lime",
    name: "Midnight Lime",
    mode: "dark",
    colors: {
      bg: "#0a0b08",
      bgDeep: "#060705",
      bgPanel: "#111310",
      surface: "#161813",
      surfaceHover: "#1c1e17",
      surfaceActive: "#22251d",
      border: "#252820",
      borderSoft: "#1a1c15",
      accent: "#b8f04a",
      accentHover: "#caff60",
      accentDim: "#b8f04a12",
      text: "#f0f0e8",
      textSecondary: "#f0f0e8b0",
      textMuted: "#f0f0e870",
      textFaint: "#f0f0e830",
      danger: "#ff5a7e",
      pin: "#ffd980",
    },
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    mode: "dark",
    colors: {
      bg: "#0a0d12",
      bgDeep: "#060810",
      bgPanel: "#0e1218",
      surface: "#131820",
      surfaceHover: "#182028",
      surfaceActive: "#1e2830",
      border: "#1e2a38",
      borderSoft: "#15202c",
      accent: "#4aabf0",
      accentHover: "#60c0ff",
      accentDim: "#4aabf012",
      text: "#e8eef4",
      textSecondary: "#e8eef4b0",
      textMuted: "#e8eef470",
      textFaint: "#e8eef430",
      danger: "#ff5a7e",
      pin: "#ffb84a",
    },
  },
  {
    id: "violet-night",
    name: "Violet Night",
    mode: "dark",
    colors: {
      bg: "#0c0a12",
      bgDeep: "#080610",
      bgPanel: "#110e18",
      surface: "#171420",
      surfaceHover: "#1e1a28",
      surfaceActive: "#252130",
      border: "#2a2538",
      borderSoft: "#1f1a2c",
      accent: "#b07aff",
      accentHover: "#c49aff",
      accentDim: "#b07aff12",
      text: "#ece8f4",
      textSecondary: "#ece8f4b0",
      textMuted: "#ece8f470",
      textFaint: "#ece8f430",
      danger: "#ff5a7e",
      pin: "#ffd980",
    },
  },
  {
    id: "rose-ember",
    name: "Rose Ember",
    mode: "dark",
    colors: {
      bg: "#120a0c",
      bgDeep: "#100608",
      bgPanel: "#180e11",
      surface: "#201417",
      surfaceHover: "#281a1e",
      surfaceActive: "#302025",
      border: "#38252a",
      borderSoft: "#2c1a1f",
      accent: "#f06a8a",
      accentHover: "#ff80a0",
      accentDim: "#f06a8a12",
      text: "#f4e8ec",
      textSecondary: "#f4e8ecb0",
      textMuted: "#f4e8ec70",
      textFaint: "#f4e8ec30",
      danger: "#ff5a7e",
      pin: "#ffd980",
    },
  },
  {
    id: "paper-light",
    name: "Paper",
    mode: "light",
    colors: {
      bg: "#fafaf8",
      bgDeep: "#f0f0ec",
      bgPanel: "#ffffff",
      surface: "#f5f5f2",
      surfaceHover: "#eeeee8",
      surfaceActive: "#e6e6e0",
      border: "#e0e0d8",
      borderSoft: "#eaeae2",
      accent: "#5a8a20",
      accentHover: "#4a7a10",
      accentDim: "#5a8a2012",
      text: "#1a1a18",
      textSecondary: "#1a1a18b0",
      textMuted: "#1a1a1870",
      textFaint: "#1a1a1830",
      danger: "#d93251",
      pin: "#c48800",
    },
  },
  {
    id: "cloud-blue",
    name: "Cloud Blue",
    mode: "light",
    colors: {
      bg: "#f6f9fc",
      bgDeep: "#edf2f8",
      bgPanel: "#ffffff",
      surface: "#f0f4f9",
      surfaceHover: "#e6ecf4",
      surfaceActive: "#dce4ee",
      border: "#d0dae8",
      borderSoft: "#dee6f0",
      accent: "#2068c8",
      accentHover: "#1858b8",
      accentDim: "#2068c812",
      text: "#141820",
      textSecondary: "#141820b0",
      textMuted: "#14182070",
      textFaint: "#14182030",
      danger: "#d93251",
      pin: "#c48800",
    },
  },
  {
    id: "warm-sand",
    name: "Warm Sand",
    mode: "light",
    colors: {
      bg: "#faf8f4",
      bgDeep: "#f2eee6",
      bgPanel: "#fffefa",
      surface: "#f5f2ec",
      surfaceHover: "#ede8e0",
      surfaceActive: "#e6e0d6",
      border: "#ddd6ca",
      borderSoft: "#e8e2d8",
      accent: "#a06820",
      accentHover: "#905810",
      accentDim: "#a0682012",
      text: "#2a2420",
      textSecondary: "#2a2420b0",
      textMuted: "#2a242070",
      textFaint: "#2a242030",
      danger: "#c83040",
      pin: "#b07a10",
    },
  },
];

const THEME_KEY = "auranotes-theme";

export function getStoredThemeId(): string {
  try {
    return localStorage.getItem(THEME_KEY) || "midnight-lime";
  } catch {
    return "midnight-lime";
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--color-bg", c.bg);
  root.style.setProperty("--color-bg-deep", c.bgDeep);
  root.style.setProperty("--color-bg-panel", c.bgPanel);
  root.style.setProperty("--color-surface", c.surface);
  root.style.setProperty("--color-surface-hover", c.surfaceHover);
  root.style.setProperty("--color-surface-active", c.surfaceActive);
  root.style.setProperty("--color-border", c.border);
  root.style.setProperty("--color-border-soft", c.borderSoft);
  root.style.setProperty("--color-accent", c.accent);
  root.style.setProperty("--color-accent-hover", c.accentHover);
  root.style.setProperty("--color-accent-dim", c.accentDim);
  root.style.setProperty("--color-text", c.text);
  root.style.setProperty("--color-text-secondary", c.textSecondary);
  root.style.setProperty("--color-text-muted", c.textMuted);
  root.style.setProperty("--color-text-faint", c.textFaint);
  root.style.setProperty("--color-danger", c.danger);
  root.style.setProperty("--color-pin", c.pin);

  try {
    localStorage.setItem(THEME_KEY, theme.id);
  } catch {}
}

const SettingsPanel: React.FC = () => {
  const [activeThemeId, setActiveThemeId] = useState(getStoredThemeId());

  // Apply stored theme on mount
  useEffect(() => {
    const theme = THEMES.find((t) => t.id === activeThemeId);
    if (theme) applyTheme(theme);
  }, []);

  const handleThemeSelect = (theme: Theme) => {
    setActiveThemeId(theme.id);
    applyTheme(theme);
  };

  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
      </div>

      <div className="settings-content">
        {/* Themes Section */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
            </svg>
            Dark Themes
          </h3>
          <div className="theme-grid">
            {darkThemes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-card ${activeThemeId === theme.id ? "active" : ""}`}
                onClick={() => handleThemeSelect(theme)}
              >
                <div className="theme-preview">
                  <div
                    className="theme-preview-bg"
                    style={{ background: theme.colors.bg }}
                  >
                    <div className="theme-preview-card" style={{ background: theme.colors.surface, borderColor: theme.colors.border }}>
                      <div className="theme-preview-accent" style={{ background: theme.colors.accent }} />
                      <div className="theme-preview-line" style={{ background: theme.colors.textFaint }} />
                      <div className="theme-preview-line short" style={{ background: theme.colors.textFaint }} />
                    </div>
                  </div>
                </div>
                <span className="theme-name">{theme.name}</span>
                {activeThemeId === theme.id && (
                  <div className="theme-active-badge">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            Light Themes
          </h3>
          <div className="theme-grid">
            {lightThemes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-card ${activeThemeId === theme.id ? "active" : ""}`}
                onClick={() => handleThemeSelect(theme)}
              >
                <div className="theme-preview">
                  <div
                    className="theme-preview-bg"
                    style={{ background: theme.colors.bg }}
                  >
                    <div className="theme-preview-card" style={{ background: theme.colors.surface, borderColor: theme.colors.border }}>
                      <div className="theme-preview-accent" style={{ background: theme.colors.accent }} />
                      <div className="theme-preview-line" style={{ background: theme.colors.textFaint }} />
                      <div className="theme-preview-line short" style={{ background: theme.colors.textFaint }} />
                    </div>
                  </div>
                </div>
                <span className="theme-name">{theme.name}</span>
                {activeThemeId === theme.id && (
                  <div className="theme-active-badge">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
