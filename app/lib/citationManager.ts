import type { CitationData, ReferenceData } from "../types/research-paper";

/**
 * Citation Manager - handles citation tracking and bibliography generation
 */
export class CitationManager {
  private citations: Map<string, CitationData> = new Map();

  /**
   * Add or update a citation
   */
  addCitation(id: string, data: CitationData): void {
    this.citations.set(id, data);
  }

  /**
   * Get a citation by ID
   */
  getCitation(id: string): CitationData | undefined {
    return this.citations.get(id);
  }

  /**
   * Remove a citation
   */
  removeCitation(id: string): void {
    this.citations.delete(id);
  }

  /**
   * Get all citations
   */
  getAllCitations(): CitationData[] {
    return Array.from(this.citations.values());
  }

  /**
   * Extract citation IDs from document content
   */
  extractCitationIds(html: string): string[] {
    const citationIds: string[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const citationElements = doc.querySelectorAll('[data-citation-id]');
    
    citationElements.forEach((element) => {
      const id = element.getAttribute("data-citation-id");
      if (id) {
        citationIds.push(id);
      }
    });

    return [...new Set(citationIds)]; // Remove duplicates
  }

  /**
   * Get citations used in document
   */
  getUsedCitations(html: string): CitationData[] {
    const ids = this.extractCitationIds(html);
    return ids
      .map((id) => this.getCitation(id))
      .filter((citation): citation is CitationData => citation !== undefined);
  }

  /**
   * Generate bibliography from used citations
   */
  generateBibliography(
    html: string,
    style: "apa" | "ieee" | "mla" | "acm" = "apa"
  ): ReferenceData {
    const usedCitations = this.getUsedCitations(html);
    
    // Sort citations by ID or author name
    const sorted = usedCitations.sort((a, b) => {
      if (style === "apa" || style === "mla") {
        const aAuthor = a.authors[0]?.toLowerCase() || "";
        const bAuthor = b.authors[0]?.toLowerCase() || "";
        return aAuthor.localeCompare(bAuthor);
      } else {
        // IEEE and ACM typically use numeric order
        return a.id.localeCompare(b.id);
      }
    });

    return {
      citations: sorted,
      style,
    };
  }
}

// Singleton instance
export const citationManager = new CitationManager();

