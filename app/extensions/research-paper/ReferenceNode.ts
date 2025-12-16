import { Node } from "@tiptap/core";
import type { ReferenceData, CitationData } from "../../types/research-paper";

export const ReferenceNode = Node.create({
  name: "references",
  group: "block",
  content: "paragraph+",
  defining: true,

  addAttributes() {
    return {
      style: {
        default: "apa" as const,
        parseHTML: (element) => {
          const style = element.getAttribute("data-reference-style");
          return (style as "apa" | "ieee" | "mla" | "acm") || "apa";
        },
        renderHTML: (attributes) => {
          return {
            "data-reference-style": attributes.style || "apa",
          };
        },
      },
      citations: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute("data-citations");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.citations || attributes.citations.length === 0) {
            return {};
          }
          return {
            "data-citations": JSON.stringify(attributes.citations),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-type="references"]',
      },
      {
        tag: 'div[data-type="references"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      {
        "data-type": "references",
        class: "research-references",
        ...HTMLAttributes,
      },
      0,
    ];
  },

  addCommands() {
    return {
      insertReferences:
        (citations: CitationData[], style?: "apa" | "ieee" | "mla" | "acm") =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              style: style || "apa",
              citations: citations || [],
            },
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [
                  {
                    type: "text",
                    text: "References",
                  },
                ],
              },
            ],
          });
        },
      updateReferences:
        (citations: CitationData[], style?: "apa" | "ieee" | "mla" | "acm") =>
        ({ commands }: { commands: any }) => {
          return commands.updateAttributes(this.name, {
            style: style || "apa",
            citations: citations || [],
          });
        },
    } as any;
  },
});

