import { Node } from "@tiptap/core";
import type { SectionType, SectionMetadata } from "../../types/research-paper";

export interface SectionNodeAttributes {
  sectionType?: SectionType;
  metadata?: SectionMetadata;
  level?: number;
}

export const SectionNode = Node.create({
  name: "researchSection",
  group: "block",
  content: "heading block+",
  defining: true,

  addAttributes() {
    return {
      sectionType: {
        default: "other" as SectionType,
        parseHTML: (element) => {
          const type = element.getAttribute("data-section-type");
          return (type as SectionType) || "other";
        },
        renderHTML: (attributes) => {
          if (!attributes.sectionType || attributes.sectionType === "other") {
            return {};
          }
          return {
            "data-section-type": attributes.sectionType,
          };
        },
      },
      metadata: {
        default: {
          sectionType: "other",
          wordCount: 0,
          citationCount: 0,
          figureCount: 0,
          equationCount: 0,
        },
        parseHTML: (element) => {
          const data = element.getAttribute("data-section-metadata");
          return data ? JSON.parse(data) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.metadata) {
            return {};
          }
          return {
            "data-section-metadata": JSON.stringify(attributes.metadata),
          };
        },
      },
      level: {
        default: 1,
        parseHTML: (element) => {
          const level = element.getAttribute("data-level");
          return level ? parseInt(level, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (!attributes.level || attributes.level === 1) {
            return {};
          }
          return {
            "data-level": attributes.level.toString(),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-type="researchSection"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      {
        "data-type": "researchSection",
        class: "research-section",
        ...HTMLAttributes,
      },
      0,
    ];
  },

  addCommands() {
    return {
      setSectionType:
        (sectionType: SectionType) =>
        ({ commands }: { commands: any }) => {
          return commands.updateAttributes(this.name, { sectionType });
        },
      setSectionMetadata:
        (metadata: SectionMetadata) =>
        ({ commands }: { commands: any }) => {
          return commands.updateAttributes(this.name, { metadata });
        },
      insertSection:
        (options: { title: string; sectionType?: SectionType }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              sectionType: options.sectionType || "other",
            },
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [
                  {
                    type: "text",
                    text: options.title,
                  },
                ],
              },
              {
                type: "paragraph",
              },
            ],
          });
        },
    } as any;
  },
});

