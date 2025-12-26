"use client";
import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

/**
 * ContextMenu component - Right-click context menu
 */
export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    // Position menu to stay within viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust if menu would overflow right
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }

      // Adjust if menu would overflow bottom
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }

      // Ensure menu doesn't go off-screen
      adjustedX = Math.max(8, adjustedX);
      adjustedY = Math.max(8, adjustedY);

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [x, y, onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[var(--z-dropdown)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md shadow-lg py-1 min-w-[180px] scale-in"
      style={{ left: `${x}px`, top: `${y}px` }}
      role="menu"
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={`separator-${index}`}
              className="h-px bg-[var(--border-primary)] my-1"
            />
          );
        }

        return (
          <button
            key={item.id}
            className={`
              w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
              transition-all duration-200 ease-in-out rounded-sm mx-1
              ${
                item.disabled
                  ? "text-[var(--text-tertiary)] cursor-not-allowed"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              }
            `}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            role="menuitem"
          >
            {item.icon && (
              <span className="w-4 h-4 flex items-center justify-center text-[var(--text-secondary)]">
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

