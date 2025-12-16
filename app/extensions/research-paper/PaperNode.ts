import { Node } from "@tiptap/core";
import type { SectionType } from "../../types/research-paper";

export interface PaperNodeAttributes {
  metadata?: {
    section?: string;
    citations?: string[];
    figures?: number;
    equations?: number;
    wordCount?: number;
  };
}

export const PaperNode = Node.create({
  name: "paper",
  group: "block",
  content: "block+", // Allow any block content for flexibility
  defining: true,

  addAttributes() {
    return {
      metadata: {
        default: {
          section: "",
          citations: [],
          figures: 0,
          equations: 0,
          wordCount: 0,
        },
        parseHTML: (element) => {
          const data = element.getAttribute("data-metadata");
          return data ? JSON.parse(data) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.metadata) {
            return {};
          }
          return {
            "data-metadata": JSON.stringify(attributes.metadata),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'article[data-type="paper"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "article",
      { "data-type": "paper", ...HTMLAttributes },
      0,
    ];
  },

  addCommands() {
    return {
      setPaperMetadata:
        (metadata: PaperNodeAttributes["metadata"]) =>
        ({ commands }: { commands: any }) => {
          return commands.updateAttributes(this.name, { metadata });
        },
    } as any;
  },
});

