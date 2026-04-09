import { useState, useCallback } from "react";

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Custom hook for managing notes state.
 * Ready to be extended with Tauri file system or database persistence.
 */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = useCallback((content: string) => {
    const now = new Date();
    const note: Note = {
      id: crypto.randomUUID(),
      content,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, content, updatedAt: new Date() } : n
      )
    );
  }, []);

  return { notes, addNote, deleteNote, updateNote };
}
