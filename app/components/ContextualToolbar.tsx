"use client";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { SectionContext } from "../utils/sectionDetector";
import type { SectionType } from "../types/research-paper";

interface ContextualToolbarProps {
  editor: Editor | null;
  context: SectionContext | null;
  position: { top: number; left: number };
  onAction: (action: string) => void;
}

interface ToolbarAction {
  label: string;
  icon?: string;
  action: string;
  shortcut?: string;
}

const getActionsForSection = (
  sectionType: SectionType | null
): ToolbarAction[] => {
  if (!sectionType) {
    return [];
  }

  switch (sectionType) {
    case "abstract":
      return [
        { label: "Shorten", action: "shorten-abstract", icon: "✂️" },
        { label: "Clarify", action: "clarify-abstract", icon: "💡" },
        {
          label: "Highlight Contribution",
          action: "highlight-contribution",
          icon: "⭐",
        },
      ];
    case "methods":
      return [
        {
          label: "Add Reproducibility",
          action: "add-reproducibility",
          icon: "🔬",
        },
        { label: "Insert Equation", action: "insert-equation", icon: "∑" },
        { label: "Insert Table", action: "insert-table", icon: "📊" },
      ];
    case "results":
      return [
        { label: "Insert Figure", action: "insert-figure", icon: "🖼️" },
        {
          label: "Statistical Notation",
          action: "statistical-notation",
          icon: "📈",
        },
        { label: "Add Table", action: "add-table", icon: "📊" },
      ];
    case "discussion":
      return [
        {
          label: "Strengthen Argument",
          action: "strengthen-argument",
          icon: "💪",
        },
        { label: "Compare Findings", action: "compare-findings", icon: "🔄" },
        { label: "Add Limitation", action: "add-limitation", icon: "⚠️" },
      ];
    case "introduction":
      return [
        { label: "Add Background", action: "add-background", icon: "📚" },
        { label: "State Problem", action: "state-problem", icon: "❓" },
        {
          label: "Outline Contribution",
          action: "outline-contribution",
          icon: "🎯",
        },
      ];
    case "conclusion":
      return [
        {
          label: "Summarize Findings",
          action: "summarize-findings",
          icon: "📝",
        },
        { label: "Future Work", action: "add-future-work", icon: "🔮" },
        { label: "Implications", action: "add-implications", icon: "💭" },
      ];
    default:
      return [];
  }
};

export function ContextualToolbar({
  editor,
  context,
  position,
  onAction,
}: ContextualToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [actions, setActions] = useState<ToolbarAction[]>([]);

  useEffect(() => {
    if (context) {
      const sectionActions = getActionsForSection(context.sectionType);
      setActions(sectionActions);
    } else {
      setActions([]);
    }
  }, [context]);

  if (!context || actions.length === 0) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      {actions.map((action) => (
        <button
          key={action.action}
          onClick={() => onAction(action.action)}
          className="px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors flex items-center gap-1.5"
          title={
            action.shortcut
              ? `${action.label} (${action.shortcut})`
              : action.label
          }
        >
          {action.icon && <span>{action.icon}</span>}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
