import type { Editor } from "@tiptap/core";
import type { SectionType } from "../types/research-paper";

export interface SectionContext {
  sectionType: SectionType;
  sectionName: string;
  isInAbstract: boolean;
  isInFrontMatter: boolean;
}

/**
 * Detects the section type from a TipTap position
 */
export function detectSectionType(
  $from: any,
  editor: Editor | null
): SectionContext {
  if (!editor) {
    return {
      sectionType: "other",
      sectionName: "",
      isInAbstract: false,
      isInFrontMatter: false,
    };
  }

  let node = $from.node($from.depth);
  let depth = $from.depth;
  let sectionType: SectionType = "other";
  let sectionName = "";
  let isInAbstract = false;
  let isInFrontMatter = false;

  // Walk up the node tree to find section context
  while (depth > 0) {
    node = $from.node(depth);

    // Check if we're in an abstract node
    if (node.type.name === "abstract") {
      isInAbstract = true;
      sectionType = "abstract";
      sectionName = "Abstract";
      break;
    }

    // Check if we're in front matter
    if (node.type.name === "frontMatter") {
      isInFrontMatter = true;
      sectionType = "abstract"; // Front matter is typically abstract-related
      sectionName = "Front Matter";
      break;
    }

    // Check if we're in a research section
    if (node.type.name === "researchSection") {
      const attrs = node.attrs as { sectionType?: SectionType };
      if (attrs.sectionType && attrs.sectionType !== "other") {
        sectionType = attrs.sectionType;
      }
    }

    // Check for heading nodes to get section name
    if (node.type.name.startsWith("heading")) {
      sectionName = node.textContent || "";
      
      // Infer section type from heading text if not explicitly set
      if (sectionType === "other") {
        const headingText = sectionName.toLowerCase();
        if (headingText.includes("introduction") || headingText.includes("intro")) {
          sectionType = "introduction";
        } else if (headingText.includes("method") || headingText.includes("methodology")) {
          sectionType = "methods";
        } else if (headingText.includes("result")) {
          sectionType = "results";
        } else if (headingText.includes("discussion")) {
          sectionType = "discussion";
        } else if (headingText.includes("conclusion")) {
          sectionType = "conclusion";
        } else if (headingText.includes("reference") || headingText.includes("bibliography")) {
          sectionType = "references";
        }
      }
    }

    depth--;
  }

  return {
    sectionType,
    sectionName,
    isInAbstract,
    isInFrontMatter,
  };
}

