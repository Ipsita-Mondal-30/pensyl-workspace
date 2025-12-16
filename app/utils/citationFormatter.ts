import { formatCitation } from "../lib/citationStyles";
import type { CitationData, ReferenceData } from "../types/research-paper";

/**
 * Format a single citation for in-text display
 */
export function formatInTextCitation(
  citation: CitationData,
  style: "apa" | "ieee" | "mla" | "acm"
): string {
  switch (style) {
    case "apa":
      if (citation.authors.length === 1) {
        return `(${citation.authors[0]}, ${citation.year || ""})`;
      } else if (citation.authors.length === 2) {
        return `(${citation.authors[0]} & ${citation.authors[1]}, ${citation.year || ""})`;
      } else {
        return `(${citation.authors[0]} et al., ${citation.year || ""})`;
      }
    case "ieee":
      return `[${citation.id}]`;
    case "mla":
      if (citation.authors.length === 1) {
        return `(${citation.authors[0]} ${citation.year || ""})`;
      } else {
        return `(${citation.authors[0]} et al. ${citation.year || ""})`;
      }
    case "acm":
      return `[${citation.id}]`;
    default:
      return `[${citation.id}]`;
  }
}

/**
 * Format bibliography entry
 */
export function formatBibliographyEntry(
  citation: CitationData,
  style: "apa" | "ieee" | "mla" | "acm"
): string {
  return formatCitation(citation, style);
}

/**
 * Format entire bibliography
 */
export function formatBibliography(referenceData: ReferenceData): string {
  return referenceData.citations
    .map((citation, index) => {
      const formatted = formatBibliographyEntry(citation, referenceData.style);
      if (referenceData.style === "ieee" || referenceData.style === "acm") {
        return `[${index + 1}] ${formatted}`;
      }
      return formatted;
    })
    .join("\n\n");
}

