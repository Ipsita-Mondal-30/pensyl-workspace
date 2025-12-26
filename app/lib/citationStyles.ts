import type { CitationData } from "../types/research-paper";

/**
 * Format citation according to style
 */
export function formatCitation(
  citation: CitationData,
  style: "apa" | "ieee" | "mla" | "acm"
): string {
  switch (style) {
    case "apa":
      return formatAPA(citation);
    case "ieee":
      return formatIEEE(citation);
    case "mla":
      return formatMLA(citation);
    case "acm":
      return formatACM(citation);
    default:
      return formatAPA(citation);
  }
}

/**
 * APA Style: Author, A. A., & Author, B. B. (Year). Title. Journal, Volume(Issue), Pages. DOI
 */
function formatAPA(citation: CitationData): string {
  const authors = formatAuthors(citation.authors, "apa");
  const year = citation.year || new Date().getFullYear();
  const title = citation.title || "";
  const journal = citation.journal || "";
  const doi = citation.doi ? ` https://doi.org/${citation.doi}` : "";
  const url = citation.url && !citation.doi ? ` ${citation.url}` : "";

  if (journal) {
    return `${authors} (${year}). ${title}. ${journal}.${doi}${url}`;
  } else {
    return `${authors} (${year}). ${title}.${doi}${url}`;
  }
}

/**
 * IEEE Style: A. Author, "Title," Journal, vol. X, no. Y, pp. Z, Year.
 */
function formatIEEE(citation: CitationData): string {
  const authors = formatAuthors(citation.authors, "ieee");
  const title = citation.title || "";
  const journal = citation.journal || "";
  const year = citation.year || new Date().getFullYear();
  const doi = citation.doi ? `, doi: ${citation.doi}` : "";

  if (journal) {
    return `${authors}, "${title}," ${journal}, ${year}.${doi}`;
  } else {
    return `${authors}, "${title}," ${year}.${doi}`;
  }
}

/**
 * MLA Style: Author, First Name. "Title." Journal, vol. X, no. Y, Year, pp. Z.
 */
function formatMLA(citation: CitationData): string {
  const authors = formatAuthors(citation.authors, "mla");
  const title = citation.title || "";
  const journal = citation.journal || "";
  const year = citation.year || new Date().getFullYear();

  if (journal) {
    return `${authors}. "${title}." ${journal}, ${year}.`;
  } else {
    return `${authors}. "${title}." ${year}.`;
  }
}

/**
 * ACM Style: Author. Year. Title. Journal. DOI
 */
function formatACM(citation: CitationData): string {
  const authors = formatAuthors(citation.authors, "acm");
  const year = citation.year || new Date().getFullYear();
  const title = citation.title || "";
  const journal = citation.journal || "";
  const doi = citation.doi ? ` DOI: ${citation.doi}` : "";

  if (journal) {
    return `${authors}. ${year}. ${title}. ${journal}.${doi}`;
  } else {
    return `${authors}. ${year}. ${title}.${doi}`;
  }
}

/**
 * Format authors list according to style
 */
function formatAuthors(
  authors: string[],
  style: "apa" | "ieee" | "mla" | "acm"
): string {
  if (!authors || authors.length === 0) {
    return "Unknown Author";
  }

  switch (style) {
    case "apa":
      if (authors.length === 1) {
        return formatAPAAuthor(authors[0]);
      } else if (authors.length === 2) {
        return `${formatAPAAuthor(authors[0])} & ${formatAPAAuthor(authors[1])}`;
      } else {
        const last = formatAPAAuthor(authors[authors.length - 1]);
        const rest = authors
          .slice(0, -1)
          .map((a) => formatAPAAuthor(a))
          .join(", ");
        return `${rest}, & ${last}`;
      }
    case "ieee":
      return authors.map((a) => formatIEEEAuthor(a)).join(", ");
    case "mla":
      return authors.map((a) => formatMLAAuthor(a)).join(", ");
    case "acm":
      return authors.map((a) => formatACMAuthor(a)).join(", ");
    default:
      return authors.join(", ");
  }
}

function formatAPAAuthor(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const first = parts[0];
  const middle = parts.slice(1, -1).map((p) => p[0]?.toUpperCase() || "");
  return `${last}, ${first}${middle.length > 0 ? " " + middle.join(". ") + "." : ""}`;
}

function formatIEEEAuthor(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const first = parts[0];
  return `${first[0]?.toUpperCase() || ""}. ${last}`;
}

function formatMLAAuthor(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return `${last}, ${first}`;
}

function formatACMAuthor(name: string): string {
  return name;
}

