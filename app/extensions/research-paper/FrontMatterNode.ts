import { Node } from "@tiptap/core";
import type { FrontMatterData } from "../../types/research-paper";

export interface FrontMatterNodeAttributes {
  title?: string;
  authors?: string[];
  affiliations?: string[];
  keywords?: string[];
}

export const FrontMatterNode = Node.create({
  name: "frontMatter",
  group: "block",
  content: "block+", // Allow any block content for flexibility
  defining: true,

  addAttributes() {
    return {
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-title") || "",
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            "data-title": attributes.title,
          };
        },
      },
      authors: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute("data-authors");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.authors || attributes.authors.length === 0) {
            return {};
          }
          return {
            "data-authors": JSON.stringify(attributes.authors),
          };
        },
      },
      affiliations: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute("data-affiliations");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.affiliations || attributes.affiliations.length === 0) {
            return {};
          }
          return {
            "data-affiliations": JSON.stringify(attributes.affiliations),
          };
        },
      },
      keywords: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute("data-keywords");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.keywords || attributes.keywords.length === 0) {
            return {};
          }
          return {
            "data-keywords": JSON.stringify(attributes.keywords),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-type="frontMatter"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      { "data-type": "frontMatter", ...HTMLAttributes },
      0,
    ];
  },

  addCommands() {
    return {
      setFrontMatter:
        (data: FrontMatterData) =>
        ({ commands }: { commands: any }) => {
          return commands.updateAttributes(this.name, {
            title: data.title,
            authors: data.authors,
            affiliations: data.affiliations,
            keywords: data.keywords,
          });
        },
    } as any;
  },
});

