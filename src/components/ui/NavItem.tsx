import React from "react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active = false,
  highlighted = false,
  onClick,
}) => {
  if (highlighted) {
    return (
      <button onClick={onClick} className="mobile-nav-item mobile-nav-highlighted">
        <div className="mobile-nav-highlight-ring">
          {icon}
        </div>
        <span className="mobile-nav-label mobile-nav-label-active">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`mobile-nav-item ${active ? "mobile-nav-active" : ""}`}
    >
      {icon}
      <span className={`mobile-nav-label ${active ? "mobile-nav-label-active" : ""}`}>
        {label}
      </span>
    </button>
  );
};

export default NavItem;
