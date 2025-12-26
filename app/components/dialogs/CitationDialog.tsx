"use client";
import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import type { CitationData } from "../../types/research-paper";
import { citationManager } from "../../lib/citationManager";
import { formatInTextCitation } from "../../utils/citationFormatter";
import { searchCitations, type Citation } from "../../services/citation.service";

interface CitationDialogProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  onInsert: (citationId: string, style: "apa" | "ieee" | "mla" | "acm") => void;
  initialSearchQuery?: string; // Optional initial search query from editor selection
}

export function CitationDialog({
  editor,
  isOpen,
  onClose,
  onInsert,
  initialSearchQuery = "",
}: CitationDialogProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedStyle, setSelectedStyle] = useState<"apa" | "ieee" | "mla" | "acm">("apa");
  const [newCitation, setNewCitation] = useState<Partial<CitationData>>({
    authors: [],
    title: "",
    year: new Date().getFullYear(),
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchResults, setSearchResults] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchOpenAlex = useCallback(async (query: string, style?: "apa" | "ieee" | "mla" | "acm") => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const citationStyle = style || selectedStyle;
      const styleForBackend = citationStyle === "ieee" ? "ieee" : citationStyle === "mla" ? "mla" : "apa";
      
      const result = await searchCitations({
        prompt: query,
        citationStyle: styleForBackend as "apa" | "mla" | "chicago" | "ieee",
      });

      // Convert backend citations to local format and add to manager
      const convertedCitations: Citation[] = result.citations || [];
      setSearchResults(convertedCitations);

      // Add found citations to citation manager with current style
      convertedCitations.forEach((citation) => {
        const citationId = citation.id || `cite-${citation.openalexId.split('/').pop() || Date.now()}`;
        const citationData: CitationData = {
          id: citationId,
          style: citationStyle,
          authors: citation.authors || [],
          title: citation.title || "",
          year: citation.year || new Date().getFullYear(),
          journal: citation.venue,
          doi: citation.doi,
        };
        citationManager.addCitation(citationData.id, citationData);
      });
    } catch (error: any) {
      console.error("Citation search error:", error);
      setSearchError(error?.message || "Failed to search citations");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedStyle]);

  // Initialize search query if provided
  useEffect(() => {
    if (initialSearchQuery && isOpen) {
      setSearchQuery(initialSearchQuery);
      handleSearchOpenAlex(initialSearchQuery);
    }
  }, [initialSearchQuery, isOpen, handleSearchOpenAlex]);

  // Debounced search for OpenAlex
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearchOpenAlex(searchQuery);
      } else {
        setSearchResults([]);
        setSearchError(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen, handleSearchOpenAlex]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allCitations = citationManager.getAllCitations();
  
  // Combine existing citations with search results (prioritize search results)
  const displayCitations = searchResults.length > 0
    ? searchResults.map((citation) => {
        const citationId = citation.id || `cite-${citation.openalexId.split('/').pop() || Date.now()}`;
        const existing = citationManager.getCitation(citationId);
        return existing || {
          id: citationId,
          style: selectedStyle,
          authors: citation.authors || [],
          title: citation.title || "",
          year: citation.year || new Date().getFullYear(),
          journal: citation.venue,
          doi: citation.doi,
        } as CitationData;
      })
    : allCitations.filter((citation) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          citation.id.toLowerCase().includes(query) ||
          citation.title.toLowerCase().includes(query) ||
          citation.authors.some((a: string) => a.toLowerCase().includes(query))
        );
      });

  const handleInsert = (citationId: string) => {
    onInsert(citationId, selectedStyle);
    setSearchQuery("");
    onClose();
  };

  const handleAddNew = () => {
    if (!newCitation.title || !newCitation.id) {
      alert("Please provide at least a title and ID");
      return;
    }

    const citation: CitationData = {
      id: newCitation.id || "",
      style: selectedStyle,
      authors: newCitation.authors || [],
      title: newCitation.title || "",
      year: newCitation.year || new Date().getFullYear(),
      journal: newCitation.journal,
      doi: newCitation.doi,
      url: newCitation.url,
    };

    citationManager.addCitation(citation.id, citation);
    handleInsert(citation.id);
  };

  const handleAddAuthor = () => {
    const authorInput = prompt("Enter author name:");
    if (authorInput) {
      setNewCitation({
        ...newCitation,
        authors: [...(newCitation.authors || []), authorInput],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Insert Citation
        </h2>

        {/* Style Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Citation Style
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => {
              const newStyle = e.target.value as "apa" | "ieee" | "mla" | "acm";
              setSelectedStyle(newStyle);
              // Re-search if we have a search query
              if (searchQuery.trim().length > 2) {
                handleSearchOpenAlex(searchQuery, newStyle);
              }
            }}
            className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          >
            <option value="apa">APA</option>
            <option value="ieee">IEEE</option>
            <option value="mla">MLA</option>
            <option value="acm">ACM</option>
          </select>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search citations (OpenAlex)..."
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {searchError && (
            <p className="text-xs text-red-500 mt-1">{searchError}</p>
          )}
          {searchResults.length > 0 && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Found {searchResults.length} citation(s) from OpenAlex
            </p>
          )}
        </div>

        {/* Toggle New Form */}
        <div className="mb-4">
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
          >
            {showNewForm ? "Cancel" : "Add New Citation"}
          </button>
        </div>

        {/* New Citation Form */}
        {showNewForm && (
          <div className="mb-4 p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-primary)] space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Citation ID
              </label>
              <input
                type="text"
                value={newCitation.id || ""}
                onChange={(e) => setNewCitation({ ...newCitation, id: e.target.value })}
                placeholder="smith2021"
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Title
              </label>
              <input
                type="text"
                value={newCitation.title || ""}
                onChange={(e) => setNewCitation({ ...newCitation, title: e.target.value })}
                placeholder="Paper title"
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Authors
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleAddAuthor}
                  className="px-3 py-1 bg-[var(--bg-hover)] rounded text-sm"
                >
                  + Add Author
                </button>
              </div>
              <div className="space-y-1">
                {newCitation.authors?.map((author, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm">{author}</span>
                    <button
                      onClick={() => {
                        setNewCitation({
                          ...newCitation,
                          authors: newCitation.authors?.filter((_, i) => i !== idx),
                        });
                      }}
                      className="text-red-500 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={newCitation.year || ""}
                  onChange={(e) => setNewCitation({ ...newCitation, year: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Journal
                </label>
                <input
                  type="text"
                  value={newCitation.journal || ""}
                  onChange={(e) => setNewCitation({ ...newCitation, journal: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleAddNew}
              className="w-full px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90"
            >
              Add Citation
            </button>
          </div>
        )}

        {/* Citation List */}
        <div className="flex-1 overflow-y-auto mb-4">
          {displayCitations.length === 0 && !isSearching ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              {searchQuery.trim().length > 0
                ? "No citations found. Try a different search term or add a new citation."
                : "No citations found. Search for citations or add a new citation to get started."}
            </p>
          ) : (
            <div className="space-y-2">
              {displayCitations.map((citation) => (
                <div
                  key={citation.id}
                  className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                  onClick={() => handleInsert(citation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)] mb-1">
                        {citation.id}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {formatInTextCitation(citation, selectedStyle)}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-1">
                        {citation.title}
                      </div>
                      {citation.doi && (
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">
                          DOI: {citation.doi}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

