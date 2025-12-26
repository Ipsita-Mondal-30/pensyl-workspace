"use client";
import { useRef, useEffect } from "react";
import { Tab, type TabData } from "./Tab";

interface TabStripProps {
  tabs: TabData[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabCloseOthers: (tabId: string) => void;
  onTabCloseAll: () => void;
  onTabRevealInExplorer: (filePath: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
}

/**
 * TabStrip component - Horizontal scrollable tab bar
 */
export function TabStrip({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabCloseOthers,
  onTabCloseAll,
  onTabRevealInExplorer,
  onTabRename,
}: TabStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && stripRef.current) {
      const strip = stripRef.current;
      const tab = activeTabRef.current;
      const stripRect = strip.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      if (tabRect.left < stripRect.left) {
        strip.scrollTo({
          left: strip.scrollLeft + (tabRect.left - stripRect.left) - 10,
          behavior: "smooth",
        });
      } else if (tabRect.right > stripRect.right) {
        strip.scrollTo({
          left: strip.scrollLeft + (tabRect.right - stripRect.right) + 10,
          behavior: "smooth",
        });
      }
    }
  }, [activeTabId]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="h-9 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-[var(--border-primary)] scrollbar-track-transparent">
      <div
        ref={stripRef}
        className="flex items-center h-full min-w-full"
        style={{ scrollbarWidth: "thin" }}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            ref={tab.id === activeTabId ? activeTabRef : null}
            className="slide-in-right"
            style={{ animationDelay: `${index * 20}ms` }}
          >
            <Tab
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={() => onTabSelect(tab.id)}
              onClose={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              onCloseOthers={() => onTabCloseOthers(tab.id)}
              onCloseAll={onTabCloseAll}
              onRevealInExplorer={() => onTabRevealInExplorer(tab.filePath)}
              onRename={(newName) => onTabRename(tab.id, newName)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

