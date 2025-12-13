"use client";
import { useState, useEffect, useCallback } from "react";

// Icon Components
const AppIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="2"
      y="2"
      width="16"
      height="16"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M6 10L9 13L14 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="text-[var(--text-tertiary)] shrink-0"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M9 9L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M2 6H10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MaximizeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <rect
      x="2"
      y="2"
      width="8"
      height="8"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

const RestoreIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <rect
      x="2"
      y="3"
      width="7"
      height="7"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <rect
      x="3"
      y="2"
      width="7"
      height="7"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M3 3L9 9M9 3L3 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

interface TopBarProps {
  onOpenSettings?: () => void;
}







/**
 * TopBar component - Custom title bar with app branding, search, and window controls
 */
export function TopBar({ onOpenSettings }: TopBarProps = {}) {
  const [searchValue, setSearchValue] = useState("");
  const [isMaximized] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Safely detect platform with fallback (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      try {
        // Try to use exposed platform API
        if ((window as any).platform) {
          setIsMac((window as any).platform.isMac === true);
        } else {
          // Fallback: detect from user agent
          setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
        }
      } catch (error) {
        setIsMac(false);
      }
    }
  }, []);

  // Initialize and listen to window state changes
  useEffect(() => {
    // Safely check if windowControls is available
    if (typeof window !== "undefined" && (window as any).windowControls) {
      try {
        // Get initial window state
        (window as any).windowControls
          .getState()
          .then((state: { isMaximized: boolean }) => {
            setIsMaximized(state.isMaximized);
          })
          .catch((error: Error) => {
            console.error("Failed to get initial window state:", error);
          });

        // Listen to window state changes
        const unsubscribe = (window as any).windowControls.onStateChange(
          (state: { isMaximized: boolean }) => {
            setIsMaximized(state.isMaximized);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Window controls not available:", error);
      }
    }
  }, []);

  // Window control handlers with error handling
  const handleMinimize = useCallback(() => {
    try {
      if ((window as any).windowControls) {
        (window as any).windowControls.minimize();
      }
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  }, []);

  const handleMaximize = useCallback(() => {
    try {
      if ((window as any).windowControls) {
        (window as any).windowControls.maximize();
      }
    } catch (error) {
      console.error("Failed to maximize window:", error);
    }
  }, []);




  


  const handleClose = useCallback(() => {
    try {
      if ((window as any).windowControls) {
        (window as any).windowControls.close();
      }
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  }, []);

  return (
    <div
      className="flex items-center justify-between h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-2 select-none drag-region"
      style={{ paddingLeft: isMac ? "78px" : "8px" }}
    >
      {/* Left: App branding - Only show if not Mac (Mac has system controls on left) */}
      {!isMac && (
        <div className="flex items-center gap-2 min-w-[200px] [&>*]:no-drag">
          <div
            className="flex items-center justify-center w-5 h-5 text-[var(--accent-primary)]"
            aria-hidden="true"
          >
            <AppIcon />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
            Intellirite
          </span>
        </div>
      )}

      {/* Mac: Show app branding in center-left area (after system controls) */}
      {isMac && (
        <div className="flex items-center gap-2 [&>*]:no-drag">
          <div
            className="flex items-center justify-center w-5 h-5 text-[var(--accent-primary)]"
            aria-hidden="true"
          >
            <AppIcon />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
            Intellirite
          </span>
        </div>
      )}

      {/* Middle: Search input */}
      <div className="flex-1 flex justify-center max-w-[600px] mx-auto [&>*]:no-drag">
        <div className="flex items-center gap-2 w-full max-w-[400px] h-7 px-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-md transition-all duration-100 focus-within:bg-[var(--bg-primary)] focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_1px_var(--accent-primary)]">
          <SearchIcon />
          <input
            type="text"
            className="flex-1 text-xs text-[var(--text-primary)] bg-transparent border-none outline-none p-0 placeholder:text-[var(--text-tertiary)]"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right: Settings Button and Window Controls */}
      <div className="flex items-center gap-2 min-w-[200px] justify-end [&>*]:no-drag">
        {/* Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center w-8 h-8 text-[var(--text-secondary)] bg-transparent border-none cursor-pointer transition-all duration-100 rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:bg-[var(--bg-active)]"
            aria-label="Settings"
            title="Settings"
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="w-4 h-4"
            >
              <path
                d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 8C12.5 7.5 12.7 7.1 12.9 6.8L13.7 5.6C13.9 5.3 13.9 4.9 13.7 4.6L12.1 2.4C11.9 2.1 11.5 2.1 11.2 2.3L10 3.1C9.7 2.9 9.3 2.7 8.8 2.7H7.2C6.7 2.7 6.3 2.9 6 3.1L4.8 2.3C4.5 2.1 4.1 2.1 3.8 2.3L2.2 4.5C2 4.8 2 5.2 2.2 5.5L3 6.7C3.3 7 3.3 7.4 3.1 7.7L2.3 8.9C2.1 9.2 2.1 9.6 2.3 9.9L3.9 12.1C4.1 12.4 4.5 12.4 4.8 12.2L6 11.4C6.3 11.6 6.7 11.8 7.2 11.8H8.8C9.3 11.8 9.7 11.6 10 11.4L11.2 12.2C11.5 12.4 11.9 12.4 12.2 12.2L13.8 10C14 9.7 14 9.3 13.8 9L13 7.8C12.7 7.5 12.5 7.1 12.5 6.6V8Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Window Controls - Hidden in web version */}
      </div>
    </div>
  );
}
