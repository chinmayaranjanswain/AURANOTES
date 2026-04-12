import React from "react";
import { ArrowRight } from "lucide-react";

interface NoteCardProps {
  title: string;
  timeAgo: string;
  onClick?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ title, timeAgo, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="mobile-note-card"
    >
      <div className="mobile-note-card-body">
        <h3 className="mobile-note-card-title">
          {title || "Untitled Note"}
        </h3>
        <span className="mobile-note-card-time">
          {timeAgo}
        </span>
      </div>
      <ArrowRight size={16} className="mobile-note-card-arrow" />
    </button>
  );
};

export default NoteCard;
