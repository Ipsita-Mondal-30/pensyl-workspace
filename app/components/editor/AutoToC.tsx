"use client";
import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";

interface ToCItem {
  id: string;
  level: number;
  text: string;
  position: number;
}

interface AutoToCProps {
  editor: Editor | null;
  onItemClick?: (position: number) => void;
}

export function AutoToC({ editor, onItemClick }: AutoToCProps) {
  const [tocItems, setTocItems] = useState<ToCItem[]>([]);

  useEffect(() => {
    if (!editor) {
      setTocItems([]);
      return;
    }

    const { state } = editor.view;
    const { doc } = state;
    const items: ToCItem[] = [];

    doc.descendants((node: any, pos: number) => {
      if (node.type.name.startsWith("heading")) {
        const level = node.attrs.level || 1;
        const text = node.textContent || "";
        
        if (text.trim()) {
          items.push({
            id: `toc-${pos}`,
            level,
            text: text.trim(),
            position: pos,
          });
        }
      }
      return true;
    });

    setTocItems(items);
  }, [editor]);

  const handleItemClick = (position: number) => {
    if (editor && onItemClick) {
      editor.commands.setTextSelection(position);
      onItemClick(position);
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        Table of Contents
      </h3>
      <nav className="space-y-1">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.position)}
            className={`block w-full text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded px-2 py-1 transition-colors ${
              item.level === 1 ? "font-semibold" : item.level === 2 ? "font-medium" : ""
            }`}
            style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
}

