/** Core application types for Auranotes */

export interface AppConfig {
  alwaysOnTop: boolean;
  opacity: number;
  theme: "dark" | "light";
}

export interface NoteMetadata {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
