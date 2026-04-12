import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ═══════════════════════════════════════
   Supabase uses snake_case columns:
     id, title, content, pinned, created_at, updated_at
   App uses camelCase in the Note interface.
   These helpers convert between them.
   ═══════════════════════════════════════ */
interface SupabaseRow {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt?: number;
  updatedAt?: number;
  created_at?: number;
  updated_at?: number;
}

function toNote(row: any): Note {
  return {
    id: row.id,
    title: row.title || "",
    content: row.content || "",
    pinned: row.pinned ?? false,
    createdAt: row.createdAt ?? row.created_at ?? Date.now(),
    updatedAt: row.updatedAt ?? row.updated_at ?? Date.now(),
  };
}

function toRow(note: Note): Record<string, any> {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    pinned: note.pinned,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

/* ═══════════════════════════════════════
   Local storage — offline persistence
   ═══════════════════════════════════════ */
const STORAGE_KEY = "auranotes-data";
const PENDING_KEY = "auranotes-pending";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

/* ─── Pending offline changes queue ─── */
interface PendingAction {
  type: "upsert" | "delete";
  note?: Note;
  id?: string;
  timestamp: number;
}

function loadPending(): PendingAction[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function savePending(pending: PendingAction[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {}
}

function addPending(action: PendingAction) {
  const pending = loadPending();
  // Deduplicate: remove older entries for the same note
  const deduplicated = pending.filter((p) => {
    if (action.type === "delete" && p.id === action.id) return false;
    if (action.type === "upsert" && p.note?.id === action.note?.id) return false;
    return true;
  });
  deduplicated.push(action);
  savePending(deduplicated);
}

/* ─── Network check ─── */
function isOnline(): boolean {
  return navigator.onLine;
}

/* ─── Merge: newer updatedAt wins per note ─── */
function mergeNotes(local: Note[], remote: Note[]): Note[] {
  const map = new Map<string, Note>();
  for (const n of local) map.set(n.id, n);
  for (const n of remote) {
    const existing = map.get(n.id);
    if (!existing || n.updatedAt >= existing.updatedAt) {
      map.set(n.id, n);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

/* ═══════════════════════════════════════
   Zustand Store
   ═══════════════════════════════════════ */
interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  syncStatus: "idle" | "syncing" | "synced" | "error" | "offline";
  editorOpen: boolean;
  currentCardIndex: number;

  // Undo delete
  undoNote: Note | null;
  undoTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  initialize: () => Promise<void>;
  syncPending: () => Promise<void>;
  addNote: (title: string, content?: string) => void;
  updateNote: (id: string, updates: Partial<Pick<Note, "title" | "content">>) => void;
  deleteNote: (id: string) => void;
  confirmDelete: () => void;
  undoDelete: () => void;
  togglePin: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setEditorOpen: (open: boolean) => void;
  setCurrentCardIndex: (index: number) => void;
  nextCard: () => void;
  prevCard: () => void;
  reorderNotes: (fromIndex: number, toIndex: number) => void;

  // Computed
  getFilteredNotes: () => Note[];
  getActiveNote: () => Note | undefined;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: loadNotes(),
  activeNoteId: null,
  searchQuery: "",
  syncStatus: "idle",
  editorOpen: false,
  currentCardIndex: 0,
  undoNote: null,
  undoTimer: null,

  /* ── Initialize: fetch from Supabase, merge with local, sync pending ── */
  initialize: async () => {
    // Always load local first (instant)
    const localNotes = loadNotes();
    set({ notes: localNotes });

    if (!isOnline()) {
      set({ syncStatus: "offline" });
      console.log("📴 Offline — using local data");
      return;
    }

    set({ syncStatus: "syncing" });
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*");

      if (error) {
        console.error("Supabase fetch error:", error.message);
        set({ syncStatus: "error" });
        return;
      }

      const remoteNotes = (data as SupabaseRow[])?.map(toNote) || [];

      if (remoteNotes.length > 0 || localNotes.length > 0) {
        const merged = mergeNotes(localNotes, remoteNotes);
        set({ notes: merged, syncStatus: "synced" });
        saveNotes(merged);

        // Push any local-only notes to Supabase
        const remoteIds = new Set(remoteNotes.map((n) => n.id));
        const localOnly = merged.filter((n) => !remoteIds.has(n.id));
        if (localOnly.length > 0) {
          console.log(`⬆️ Pushing ${localOnly.length} local-only note(s) to Supabase...`);
          await supabase.from("notes").upsert(localOnly.map(toRow), { onConflict: "id" });
        }

        // Push any local notes that are newer than remote
        const newerLocal = merged.filter((n) => {
          const remote = remoteNotes.find((r) => r.id === n.id);
          return remote && n.updatedAt > remote.updatedAt;
        });
        if (newerLocal.length > 0) {
          console.log(`⬆️ Syncing ${newerLocal.length} updated local note(s)...`);
          await supabase.from("notes").upsert(newerLocal.map(toRow), { onConflict: "id" });
        }
      } else {
        set({ syncStatus: "synced" });
      }

      // Flush any pending offline actions
      await get().syncPending();
    } catch (err: any) {
      console.error("Sync error:", err.message);
      set({ syncStatus: "error" });
    }
  },

  /* ── Sync pending offline changes ── */
  syncPending: async () => {
    if (!isOnline()) return;

    const pending = loadPending();
    if (pending.length === 0) return;

    console.log(`🔄 Syncing ${pending.length} pending offline action(s)...`);
    const failed: PendingAction[] = [];

    for (const action of pending) {
      try {
        if (action.type === "upsert" && action.note) {
          const { error } = await supabase
            .from("notes")
            .upsert([toRow(action.note)], { onConflict: "id" });
          if (error) {
            console.error("Pending upsert failed:", error.message);
            failed.push(action);
          }
        } else if (action.type === "delete" && action.id) {
          const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", action.id);
          if (error) {
            console.error("Pending delete failed:", error.message);
            failed.push(action);
          }
        }
      } catch {
        failed.push(action);
      }
    }

    savePending(failed);
    if (failed.length === 0) {
      console.log("✅ All pending actions synced!");
    } else {
      console.log(`⚠️ ${failed.length} action(s) still pending`);
    }
  },

  /* ── Add Note: save local immediately, sync to server if online ── */
  addNote: async (title, content = "") => {
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
      return { notes: updated, activeNoteId: note.id, currentCardIndex: 0 };
    });

    if (isOnline()) {
      try {
        const { error } = await supabase.from("notes").insert([toRow(note)]);
        if (error) {
          console.error("Failed to save to Supabase:", error.message);
          addPending({ type: "upsert", note, timestamp: now });
        }
      } catch {
        addPending({ type: "upsert", note, timestamp: now });
      }
    } else {
      addPending({ type: "upsert", note, timestamp: now });
    }
  },

  /* ── Update Note ── */
  updateNote: async (id, updates) => {
    const timestamp = Date.now();

    let updatedNote: Note | undefined;
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === id) {
          updatedNote = { ...n, ...updates, updatedAt: timestamp };
          return updatedNote;
        }
        return n;
      });
      saveNotes(updatedNotes);
      return { notes: updatedNotes };
    });

    if (!updatedNote) return;

    if (isOnline()) {
      try {
        const { error } = await supabase
          .from("notes")
          .update({ ...updates, updatedAt: timestamp })
          .eq("id", id);
        if (error) {
          console.error("Failed to update in Supabase:", error.message);
          addPending({ type: "upsert", note: updatedNote, timestamp });
        }
      } catch {
        addPending({ type: "upsert", note: updatedNote!, timestamp });
      }
    } else {
      addPending({ type: "upsert", note: updatedNote, timestamp });
    }
  },

  /* ── Delete Note ── */
  deleteNote: async (id) => {
    const state = get();
    const noteToDelete = state.notes.find((n) => n.id === id);
    if (!noteToDelete) return;

    if (state.undoTimer) clearTimeout(state.undoTimer);

    const updated = state.notes.filter((n) => n.id !== id);
    saveNotes(updated);

    // Delete from server
    if (isOnline()) {
      supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) {
            console.error("❌ Supabase delete failed:", error.message);
            addPending({ type: "delete", id, timestamp: Date.now() });
          }
        });
    } else {
      addPending({ type: "delete", id, timestamp: Date.now() });
    }

    const timer = setTimeout(() => {
      set({ undoNote: null, undoTimer: null });
    }, 3000);

    set({
      notes: updated,
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      editorOpen: state.activeNoteId === id ? false : state.editorOpen,
      undoNote: noteToDelete,
      undoTimer: timer,
      currentCardIndex: Math.min(state.currentCardIndex, Math.max(0, updated.length - 1)),
    });
  },

  confirmDelete: () => {
    set({ undoNote: null, undoTimer: null });
  },

  /* ── Undo Delete ── */
  undoDelete: async () => {
    const { undoNote, undoTimer } = get();
    if (!undoNote) return;

    if (undoTimer) clearTimeout(undoTimer);

    set((state) => {
      const restored = [undoNote, ...state.notes].sort((a, b) => b.updatedAt - a.updatedAt);
      saveNotes(restored);
      return { notes: restored, undoNote: null, undoTimer: null, currentCardIndex: 0 };
    });

    if (isOnline()) {
      try {
        const { error } = await supabase
          .from("notes")
          .upsert([toRow(undoNote)], { onConflict: "id" });
        if (error) console.error("❌ Failed to restore to Supabase:", error.message);
      } catch (err: any) {
        console.error("❌ Restore exception:", err.message);
        addPending({ type: "upsert", note: undoNote, timestamp: Date.now() });
      }
    } else {
      addPending({ type: "upsert", note: undoNote, timestamp: Date.now() });
    }
  },

  /* ── Toggle Pin ── */
  togglePin: async (id) => {
    let newPinnedState = false;
    const timestamp = Date.now();

    let toggledNote: Note | undefined;
    set((state) => {
      const updated = state.notes.map((n) => {
        if (n.id === id) {
          newPinnedState = !n.pinned;
          toggledNote = { ...n, pinned: newPinnedState, updatedAt: timestamp };
          return toggledNote;
        }
        return n;
      });
      saveNotes(updated);
      return { notes: updated };
    });

    if (isOnline()) {
      try {
        const { error } = await supabase
          .from("notes")
          .update({ pinned: newPinnedState, updatedAt: timestamp })
          .eq("id", id);
        if (error) {
          console.error("Failed to toggle pin in Supabase:", error.message);
          if (toggledNote) addPending({ type: "upsert", note: toggledNote, timestamp });
        }
      } catch {
        if (toggledNote) addPending({ type: "upsert", note: toggledNote, timestamp });
      }
    } else {
      if (toggledNote) addPending({ type: "upsert", note: toggledNote, timestamp });
    }
  },

  setActiveNote: (id) => set({ activeNoteId: id }),
  setSearchQuery: (query) => set({ searchQuery: query, currentCardIndex: 0 }),
  setEditorOpen: (open) => set({ editorOpen: open }),
  setCurrentCardIndex: (index) => set({ currentCardIndex: index }),

  nextCard: () => {
    const filtered = get().getFilteredNotes();
    set((state) => ({
      currentCardIndex: Math.min(state.currentCardIndex + 1, filtered.length - 1),
    }));
  },

  prevCard: () => {
    set((state) => ({
      currentCardIndex: Math.max(state.currentCardIndex - 1, 0),
    }));
  },

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
    const sorted = [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    if (!query) return sorted;
    return sorted.filter(
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

/* ═══════════════════════════════════════
   Auto-sync when coming back online
   ═══════════════════════════════════════ */
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("🌐 Back online — syncing...");
    const store = useNotesStore.getState();
    store.syncPending().then(() => store.initialize());
  });

  window.addEventListener("offline", () => {
    console.log("📴 Went offline");
    useNotesStore.setState({ syncStatus: "offline" });
  });

  // Automatically listen for server-side changes (Realtime)
  supabase
    .channel("public:notes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notes" },
      (payload) => {
        console.log("🔄 Realtime change from server:", payload);
        useNotesStore.getState().initialize();
      }
    )
    .subscribe((status) => {
      console.log("📡 Supabase Realtime status:", status);
    });
}
