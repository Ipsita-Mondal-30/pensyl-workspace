// TypeScript interfaces for research paper structure

export interface PaperMetadata {
  section: string;
  citations: string[];
  figures: number;
  equations: number;
  wordCount: number;
}

export type SectionType =
  | "abstract"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references"
  | "other";

export interface SectionMetadata {
  sectionType: SectionType;
  wordCount: number;
  citationCount: number;
  figureCount: number;
  equationCount: number;
}

export interface FrontMatterData {
  title: string;
  authors: string[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
}

export interface CitationData {
  id: string;
  style: "apa" | "ieee" | "mla" | "acm";
  authors: string[];
  title: string;
  year: number;
  journal?: string;
  doi?: string;
  url?: string;
}

export interface ReferenceData {
  citations: CitationData[];
  style: "apa" | "ieee" | "mla" | "acm";
}

