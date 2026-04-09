import { create } from "zustand";

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;

  // Actions
  addNote: (title: string, content?: string) => void;
  updateNote: (id: string, updates: Partial<Pick<Note, "title" | "content">>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  reorderNotes: (fromIndex: number, toIndex: number) => void;

  // Computed
  getFilteredNotes: () => Note[];
  getActiveNote: () => Note | undefined;
}

const STORAGE_KEY = "auranotes-data";

/** Load notes from localStorage */
function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse errors
  }
  return [];
}

/** Save notes to localStorage */
function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Ignore storage errors
  }
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: loadNotes(),
  activeNoteId: null,
  searchQuery: "",

  addNote: (title, content = "") => {
    const now = Date.now();
    const note: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const updated = [note, ...state.notes];
      saveNotes(updated);
      return { notes: updated, activeNoteId: note.id };
    });
  },

  updateNote: (id, updates) => {
    set((state) => {
      const updated = state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      );
      saveNotes(updated);
      return { notes: updated };
    });
  },

  deleteNote: (id) => {
    set((state) => {
      const updated = state.notes.filter((n) => n.id !== id);
      saveNotes(updated);
      return {
        notes: updated,
        activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      };
    });
  },

  togglePin: (id) => {
    set((state) => {
      const updated = state.notes.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
      );
      saveNotes(updated);
      return { notes: updated };
    });
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  reorderNotes: (fromIndex, toIndex) => {
    set((state) => {
      const updated = [...state.notes];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      saveNotes(updated);
      return { notes: updated };
    });
  },

  getFilteredNotes: () => {
    const { notes, searchQuery } = get();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
    );
  },

  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find((n) => n.id === activeNoteId);
  },
}));
